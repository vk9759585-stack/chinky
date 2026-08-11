const Post = require("../models/Post");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const listFromBody = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
};

const cloudinaryVideoThumbnail = (upload) => {
    if (!upload || !upload.public_id) return "";
    try {
        return cloudinary.url(upload.public_id, {
            resource_type: "video",
            secure: true,
            format: "jpg",
            transformation: [{ width: 720, height: 720, crop: "fill", gravity: "auto" }]
        });
    } catch (_) {
        return "";
    }
};

const removeTemporaryUpload = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.promises.unlink(filePath);
    } catch (_) {}
};

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

        try {
            const result = await cloudinary.uploader.upload(
                req.file.path,
                {
                    resource_type: mediaType,
                    folder: `chinky/posts/${mediaType}s`
                }
            );

            const post = await Post.create({
                user: req.user.id,
                image: result.secure_url,
                thumbnail: mediaType === "video" ? cloudinaryVideoThumbnail(result) : result.secure_url,
                mediaType,
                caption: req.body.caption || "",
                location: req.body.location || "",
                taggedUsers: listFromBody(req.body.taggedUsers),
                products: listFromBody(req.body.products)
            });

            await removeTemporaryUpload(req.file.path);

            return res.status(201).json({
                success: true,
                data: post
            });
        } catch (error) {
            await removeTemporaryUpload(req.file.path);
            return res.status(502).json({
                success: false,
                message: "Media could not be stored. Please try uploading again."
            });
        }

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
        const limit = Math.min(Math.max(Number(req.query.limit) || 30, 10), 50);
        const viewerId =
            req.user.id ||
            req.user._id ||
            req.user.userId;

        const posts = await Post.find()
            .populate(
                "user",
                "name username profileImage verified isPrivate followers"
            )
            .sort({
                createdAt: -1
            })
            // Over-fetch because private posts may be removed below.
            .limit(limit * 2);

        const visiblePosts = posts.filter((post) => {
            const owner = post.user;

            if (!owner || !owner.isPrivate) {
                return true;
            }

            const ownerId = owner._id.toString();

            return (
                ownerId === viewerId?.toString() ||
                owner.followers.some(
                    (id) => id.toString() === viewerId?.toString()
                )
            );
        });

        const flow = visiblePosts.slice(0, limit).map((post) => {
            const data = post.toObject();
            const ownerFollowers = post.user?.followers || [];
            if (data.user?.followers) delete data.user.followers;
            delete data.viewedBy;
            return {
                ...data,
                liked: post.likes.some(
                    (id) => id.toString() === viewerId?.toString()
                ),
                saved: post.saves.some(
                    (id) => id.toString() === viewerId?.toString()
                ),
                isFollowing: ownerFollowers.some(
                    (id) => id.toString() === viewerId?.toString()
                ),
                creatorFollowerCount: ownerFollowers.length
            };
        });

        return res.status(200).json({
            success: true,
            count: flow.length,
            data: flow
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

        await Promise.all([
            Post.findByIdAndDelete(req.params.id),
            User.updateMany(
                { savedPosts: post._id },
                { $pull: { savedPosts: post._id } }
            )
        ]);

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

exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });
        if (post.user.toString() !== req.user.id.toString()) return res.status(401).json({ success: false, message: "Unauthorized" });

        if (Object.prototype.hasOwnProperty.call(req.body, "caption")) post.caption = (req.body.caption || "").trim();
        if (Object.prototype.hasOwnProperty.call(req.body, "location")) post.location = (req.body.location || "").trim();
        if (Object.prototype.hasOwnProperty.call(req.body, "taggedUsers")) post.taggedUsers = listFromBody(req.body.taggedUsers);
        if (Object.prototype.hasOwnProperty.call(req.body, "products")) post.products = listFromBody(req.body.products);
        post.isEdited = true;
        await post.save();
        return res.json({ success: true, data: post });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// SAVE OR UNSAVE POST
// ======================================

exports.toggleSavePost = async (req, res) => {
    try {
        const userId = (req.user.id || req.user._id || req.user.userId).toString();
        const [post, user] = await Promise.all([
            Post.findById(req.params.id),
            User.findById(userId)
        ]);
        if (!post || !user) return res.status(404).json({ success: false, message: "Post or user not found" });

        const currentlySaved = post.saves.some((id) => id.toString() === userId);
        const desired = typeof req.body?.saved === "boolean" ? req.body.saved : !currentlySaved;

        if (desired && !currentlySaved) {
            post.saves.addToSet(userId);
            user.savedPosts.addToSet(post._id);
        } else if (!desired && currentlySaved) {
            post.saves.pull(userId);
            user.savedPosts.pull(post._id);
        }

        await Promise.all([post.save(), user.save()]);
        return res.status(200).json({ success: true, saved: desired, totalSaves: post.saves.length });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// RECORD POST SHARE
// ======================================

exports.recordShare = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { shares: 1 } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        return res.status(200).json({
            success: true,
            shares: post.shares
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// Count a post view at most once per authenticated user.
exports.addView = async (req, res) => {
    try {
        const userId = req.user.id;
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, viewedBy: { $ne: userId } },
            { $addToSet: { viewedBy: userId }, $inc: { views: 1 } },
            { new: true }
        );
        if (post) return res.json({ success: true, views: post.views, counted: true });
        const existing = await Post.findById(req.params.id).select("views");
        if (!existing) return res.status(404).json({ success: false, message: "Post not found" });
        return res.json({ success: true, views: existing.views, counted: false });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
