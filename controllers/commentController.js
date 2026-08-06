const Comment = require("../models/Comment");
const Post = require("../models/Post");

// =====================================
// GET COMMENTS
// =====================================

exports.getComments = async (req, res) => {
    try {
        const comments = await Comment.find({
            post: req.params.id
        })
            .populate("user", "username profileImage")
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// ADD COMMENT
// =====================================

exports.addComment = async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {

            return res.status(404).json({
                success: false,
                message: "Post not found"
            });

        }

        const comment = await Comment.create({

            user: req.user.id,

            post: req.params.id,

            comment: req.body.comment

        });

        await Post.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    comments: comment._id
                }
            }
        );

        const result = await Comment.findById(comment._id)
            .populate("user", "username profileImage");

        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: result
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// DELETE COMMENT
// =====================================

exports.deleteComment = async (req, res) => {

    try {

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {

            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });

        }

        if (comment.user.toString() !== req.user.id) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }

        await Comment.findByIdAndDelete(req.params.commentId);

        return res.status(200).json({
            success: true,
            message: "Comment deleted"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// EDIT COMMENT
// =====================================

exports.editComment = async (req, res) => {

    try {

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {

            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });

        }

        comment.comment = req.body.comment;
        comment.edited = true;

        await comment.save();

        return res.status(200).json({
            success: true,
            data: comment
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};