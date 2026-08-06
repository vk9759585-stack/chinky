const Post = require("../models/Post");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ======================================
// CREATE FLOW POST
// ======================================

exports.createPost = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Media file is required"
            });
        }

        const mediaType = req.file.mimetype.startsWith("video/")
            ? "video"
            : "image";

        let mediaUrl = "";

        try {
            const result = await cloudinary.uploader.upload(
                req.file.path,
                {
                    resource_type: mediaType,
                    folder: `chinky/posts/${mediaType}s`
                }
            );

            mediaUrl = result.secure_url;

            await fs.promises.unlink(req.file.path);

        } catch (error) {

            mediaUrl =
                `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const post = await Post.create({
            user: req.user.id,
            image: mediaUrl,
            mediaType,
            caption: req.body.caption || ""
        });

        return res.status(201).json({
            success: true,
            data: post
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// GET FLOW
// ======================================

exports.getFlow = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate(
                "user",
                "name username profileImage verified isPrivate followers"
            )
            .sort({
                createdAt: -1
            });

        const visiblePosts = posts.filter((post) => {
            const owner = post.user;

            if (!owner || !owner.isPrivate) {
                return true;
            }

            const ownerId = owner._id.toString();

            return (
                ownerId === req.user.id ||
                owner.followers.some(
                    (id) => id.toString() === req.user.id
                )
            );
        });

        return res.status(200).json({
            success: true,
            count: visiblePosts.length,
            data: visiblePosts
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// DELETE POST
// ======================================

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Post deleted"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};