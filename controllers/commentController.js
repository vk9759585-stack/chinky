const Comment = require("../models/Comment");

const Post = require("../models/Post");

exports.getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.id })
            .populate("user", "username profileImage")
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addComment = async (req, res) => {

    try {

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

        res.status(201).json(comment);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};
