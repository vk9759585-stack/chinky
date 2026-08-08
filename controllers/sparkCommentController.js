const SparkComment = require("../models/SparkComment");
const Spark = require("../models/Spark");

const populatedComment = (id) => SparkComment.findById(id)
    .populate("user", "name username profileImage verified")
    .populate("parentComment");

exports.addComment = async (req, res) => {
    try {
        const reelId = req.body.reelId;
        const text = req.body.comment?.trim();
        if (!reelId) return res.status(400).json({ success: false, message: "Spark ID is required" });
        if (!text) return res.status(400).json({ success: false, message: "Comment is required" });

        const spark = await Spark.findById(reelId).select("_id comments");
        if (!spark) return res.status(404).json({ success: false, message: "Spark not found" });

        const comment = await SparkComment.create({ reel: reelId, user: req.user.id, comment: text });
        spark.comments.addToSet(comment._id);
        await spark.save();

        const result = await populatedComment(comment._id);
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
        return res.json({ success: true, page, count: comments.length, total, hasMore: skip + comments.length < total, data: comments });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
