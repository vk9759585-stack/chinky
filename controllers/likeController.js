const Post = require("../models/Post");

exports.likePost = async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {

            return res.status(404).json({
                message: "Post not found"
            });

        }

        const userId = req.user.id;

        if (post.likes.includes(userId)) {

            post.likes.pull(userId);

        } else {

            post.likes.push(userId);

        }

        await post.save();

        res.json(post);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};