const Comment = require("../models/Comment");

const Post = require("../models/Post");

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