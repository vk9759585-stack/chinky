const SparkComment = require("../models/SparkComment");

// ======================================
// ADD COMMENT
// ======================================

exports.addComment = async (req, res) => {
    try {
        const { reelId, comment } = req.body;

        if (!reelId) {
            return res.status(400).json({
                success: false,
                message: "Spark ID is required"
            });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment is required"
            });
        }

        const newComment = await SparkComment.create({
            reel: reelId,
            user: req.user.id,
            comment: comment.trim()
        });

        const result = await SparkComment.findById(
            newComment._id
        ).populate(
            "user",
            "username profileImage verified"
        );

        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// GET COMMENTS
// ======================================

exports.getComments = async (req, res) => {
    try {
        const comments = await SparkComment.find({
            reel: req.params.id
        })
            .populate(
                "user",
                "username profileImage verified"
            )
            .sort({
                createdAt: -1
            });

        return res.json({
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