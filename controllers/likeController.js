const Post = require("../models/Post");

// =====================================
// LIKE OR UNLIKE POST
// =====================================

exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const userId = req.user.id;

        const alreadyLiked = post.likes.some(
            (id) => id.toString() === userId.toString()
        );

        if (alreadyLiked) {
            post.likes.pull(userId);

            await post.save();

            return res.status(200).json({
                success: true,
                liked: false,
                totalLikes: post.likes.length
            });
        }

        post.likes.push(userId);

        await post.save();

        return res.status(200).json({
            success: true,
            liked: true,
            totalLikes: post.likes.length
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};