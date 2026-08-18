const SparkComment = require("../models/SparkComment");
const Spark = require("../models/Spark");
const { createSocialNotification } = require("../services/socialNotificationService");
const { canInteract, isCommentFiltered } = require("../services/privacyGuardService");

const populatedComment = (id) => SparkComment.findById(id)
    .populate("user", "name username profileImage verified")
    .populate("parentComment");

exports.addComment = async (req, res) => {
    try {
        const reelId = req.body.reelId;
        const text = req.body.comment?.trim();
        if (!reelId) return res.status(400).json({ success: false, message: "Spark ID is required" });
        if (!text) return res.status(400).json({ success: false, message: "Comment is required" });

        const spark = await Spark.findById(reelId).select("_id comments user");
        if (!spark) return res.status(404).json({ success: false, message: "Spark not found" });
        if (!(await canInteract(spark.user, req.user.id, "comments"))) {
            return res.status(403).json({ success: false, message: "Comments are limited by this account's privacy settings" });
        }
        if (await isCommentFiltered(spark.user, text)) {
            return res.status(400).json({ success: false, message: "This comment contains a blocked keyword" });
        }

        const comment = await SparkComment.create({ reel: reelId, user: req.user.id, comment: text });
        spark.comments.addToSet(comment._id);
        await spark.save();

        const result = await populatedComment(comment._id);
        const senderId = req.user.id || req.user._id || req.user.userId;
        if (spark.user && spark.user.toString() !== senderId.toString()) {
            await createSocialNotification(req, {
                sender: senderId,
                receiver: spark.user,
                type: "comment",
                title: "New Spark comment",
                body: text.length > 80 ? `${text.slice(0, 77)}...` : text,
                link: `/spark/${spark._id}`
            }).catch(() => {});
        }
        return res.status(201).json({ success: true, data: result, comments: spark.comments.length });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.addReply = async (req, res) => {
    try {
        const text = req.body.comment?.trim();
        if (!text) return res.status(400).json({ success: false, message: "Reply is required" });
        const parent = await SparkComment.findOne({ _id: req.params.commentId, reel: req.params.id });
        if (!parent) return res.status(404).json({ success: false, message: "Spark comment not found" });
        const spark = await Spark.findById(req.params.id).select("user").lean();
        if (!spark) return res.status(404).json({ success: false, message: "Spark not found" });
        if (!(await canInteract(spark.user, req.user.id, "comments"))) {
            return res.status(403).json({ success: false, message: "Replies are limited by this account's privacy settings" });
        }
        if (await isCommentFiltered(spark.user, text)) {
            return res.status(400).json({ success: false, message: "This reply contains a blocked keyword" });
        }
        const reply = await SparkComment.create({
            reel: req.params.id,
            user: req.user.id,
            parentComment: parent._id,
            comment: text
        });
        const result = await populatedComment(reply._id);
        return res.status(201).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getComments = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
        const skip = (page - 1) * limit;
        const [comments, total] = await Promise.all([
            SparkComment.find({ reel: req.params.id })
                .populate("user", "name username profileImage verified")
                .populate("parentComment")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SparkComment.countDocuments({ reel: req.params.id })
        ]);
        const uid = req.user.id.toString();
        const data = comments.map(c => { const o=c.toObject(); return {...o, likesCount:(o.likes||[]).length, liked:(o.likes||[]).some(id=>id.toString()===uid)}; });
        return res.json({ success: true, page, count: comments.length, total, hasMore: skip + comments.length < total, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


exports.toggleCommentLike = async (req, res) => {
  try {
    const comment = await SparkComment.findOne({ _id: req.params.commentId, reel: req.params.id });
    if (!comment) return res.status(404).json({ success:false, message:'Comment not found' });
    const uid = req.user.id.toString();
    const liked = comment.likes.some(id => id.toString() === uid);
    if (liked) comment.likes.pull(req.user.id); else comment.likes.addToSet(req.user.id);
    await comment.save();
    return res.json({ success:true, liked: !liked, likesCount: comment.likes.length });
  } catch (err) { return res.status(500).json({ success:false, message:err.message }); }
};

exports.reportComment = async (req, res) => {
  try {
    const Report = require('../models/Report');
    const comment = await SparkComment.findOne({ _id: req.params.commentId, reel: req.params.id });
    if (!comment) return res.status(404).json({ success:false, message:'Comment not found' });
    const reason = (req.body.reason || 'Inappropriate comment').trim();
    await Report.create({ reporter:req.user.id, targetUser:comment.user, targetComment:comment._id, targetType:'spark_comment', reason });
    return res.json({ success:true, message:'Report submitted' });
  } catch (err) { return res.status(500).json({ success:false, message:err.message }); }
};

exports.editComment = async (req, res) => {
  try {
    const comment = await SparkComment.findOne({ _id:req.params.commentId, reel:req.params.id });
    if (!comment) return res.status(404).json({ success:false, message:'Comment not found' });
    if (comment.user.toString() !== req.user.id.toString()) return res.status(401).json({ success:false, message:'Unauthorized' });
    const text=(req.body.comment||'').trim(); if(!text) return res.status(400).json({success:false,message:'Comment cannot be empty'});
    comment.comment=text; await comment.save(); const result=await populatedComment(comment._id);
    return res.json({success:true,data:result});
  } catch(err){ return res.status(500).json({success:false,message:err.message}); }
};
exports.deleteComment = async (req, res) => {
  try {
    const comment = await SparkComment.findOne({ _id:req.params.commentId, reel:req.params.id });
    if (!comment) return res.status(404).json({success:false,message:'Comment not found'});
    if(comment.user.toString()!==req.user.id.toString()) return res.status(401).json({success:false,message:'Unauthorized'});
    const isTop=!comment.parentComment;
    await Promise.all([SparkComment.findByIdAndDelete(comment._id), SparkComment.deleteMany({parentComment:comment._id}), Spark.findByIdAndUpdate(req.params.id,{$pull:{comments:comment._id}})]);
    return res.json({success:true,message:'Comment deleted',topLevel:isTop});
  } catch(err){ return res.status(500).json({success:false,message:err.message}); }
};
