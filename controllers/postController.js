const Post = require("../models/Post");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const Audio = require("../models/Audio");

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

const editFromBody = (value, fallbackFilter = "Original") => {
    let raw = value;
    if (typeof raw === "string") {
        try { raw = JSON.parse(raw); } catch (_) { raw = {}; }
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) raw = {};
    const number = (key, fallback, min, max) => {
        const parsed = Number(raw[key]);
        return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
    };
    const requestedQuality = String(raw.exportQuality || "720P").toUpperCase();
    return {
        filter: String(raw.filter || fallbackFilter).slice(0, 30),
<<<<<<< Updated upstream
<<<<<<< HEAD
=======
        effect: String(raw.effect || "None").slice(0, 30),
>>>>>>> 91687b9 (Complete Chinky backend fixes)
=======
        effect: String(raw.effect || "None").slice(0, 30),
>>>>>>> Stashed changes
        brightness: number("brightness", 0, -0.5, 0.5),
        contrast: number("contrast", 1, 0.5, 1.8),
        saturation: number("saturation", 1, 0, 2),
        overlayText: String(raw.overlayText || "").trim().slice(0, 80),
        overlayX: number("overlayX", 0.5, 0, 1),
        overlayY: number("overlayY", 0.5, 0, 1),
        sticker: String(raw.sticker || "").slice(0, 8),
        stickerX: number("stickerX", 0.78, 0, 1),
        stickerY: number("stickerY", 0.28, 0, 1),
<<<<<<< Updated upstream
<<<<<<< HEAD
=======
=======
>>>>>>> Stashed changes
        overlayImageUrl: String(raw.overlayImageUrl || "").slice(0, 2000),
        overlayImageX: number("overlayImageX", 0.5, 0, 1),
        overlayImageY: number("overlayImageY", 0.45, 0, 1),
        overlayImageScale: number("overlayImageScale", 0.38, 0.12, 0.9),
        captionText: String(raw.captionText || "").trim().slice(0, 140),
<<<<<<< Updated upstream
>>>>>>> 91687b9 (Complete Chinky backend fixes)
=======
>>>>>>> Stashed changes
        audioTitle: String(raw.audioTitle || "Original audio").slice(0, 120),
        audioId: String(raw.audioId || "").slice(0, 80),
        audioStreamUrl: String(raw.audioStreamUrl || "").slice(0, 2000),
        muted: raw.muted === true,
        volume: number("volume", 1, 0, 1),
        playbackSpeed: number("playbackSpeed", 1, 0.5, 2),
        trimStartMs: Math.round(number("trimStartMs", 0, 0, 86400000)),
        trimEndMs: Math.round(number("trimEndMs", 0, 0, 86400000)),
        exportQuality: ["480P", "720P", "1080P"].includes(requestedQuality) ? requestedQuality : "720P"
    };
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
    const mediaFile = req.files?.image?.[0];
    const overlayFile = req.files?.overlay?.[0];
    const uploadKey = String(req.body.clientUploadId || "").trim().slice(0, 160);
    try {
        if (uploadKey) {
            const existing = await Post.findOne({ user: req.user.id, uploadKey });
            if (existing) {
                await removeTemporaryUpload(mediaFile?.path);
                await removeTemporaryUpload(overlayFile?.path);
                return res.status(200).json({ success: true, data: existing, duplicate: true });
            }
        }
        if (!mediaFile) {
            await removeTemporaryUpload(overlayFile?.path);
            return res.status(400).json({ success: false, message: "Media file is required" });
        }

<<<<<<< Updated upstream
<<<<<<< HEAD
        const mediaType = req.file.mimetype.startsWith("video/")
            ? "video"
            : "image";
=======
        const mediaType = mediaFile.mimetype.startsWith("video/") ? "video" : "image";
>>>>>>> 91687b9 (Complete Chinky backend fixes)
=======
        const mediaType = mediaFile.mimetype.startsWith("video/") ? "video" : "image";
>>>>>>> Stashed changes
        const edit = editFromBody(req.body.edit, req.body.filter || "Original");
        const qualityWidth = edit.exportQuality === "1080P" ? 1080 : edit.exportQuality === "480P" ? 480 : 720;

        try {
<<<<<<< Updated upstream
<<<<<<< HEAD
            const result = await cloudinary.uploader.upload(
                req.file.path,
                {
                    resource_type: mediaType,
                    folder: `chinky/posts/${mediaType}s`,
                    transformation: [{ width: qualityWidth, crop: "limit" }]
                }
            );
=======
=======
>>>>>>> Stashed changes
            const result = await cloudinary.uploader.upload(mediaFile.path, {
                resource_type: mediaType,
                folder: `chinky/posts/${mediaType}s`,
                transformation: [{ width: qualityWidth, crop: "limit" }]
            });

            if (overlayFile) {
                const overlayUpload = await cloudinary.uploader.upload(overlayFile.path, {
                    resource_type: "image",
                    folder: "chinky/overlays",
                    transformation: [{ width: 1200, crop: "limit" }]
                });
                edit.overlayImageUrl = overlayUpload.secure_url || "";
            }
<<<<<<< Updated upstream
>>>>>>> 91687b9 (Complete Chinky backend fixes)
=======
>>>>>>> Stashed changes

            const post = await Post.create({
                user: req.user.id,
                uploadKey,
                image: result.secure_url,
                thumbnail: mediaType === "video" ? cloudinaryVideoThumbnail(result) : result.secure_url,
                mediaType,
                caption: req.body.caption || "",
                filter: edit.filter,
                audioTitle: edit.audioTitle,
                edit,
                location: req.body.location || "",
                taggedUsers: listFromBody(req.body.taggedUsers),
                products: listFromBody(req.body.products)
            });

            if (edit.audioId) {
                await Audio.updateOne(
                    { _id: edit.audioId, reusable: true, blocked: false },
                    { $inc: { usageCount: 1 } }
                ).catch(() => {});
            }
<<<<<<< Updated upstream
<<<<<<< HEAD

            await removeTemporaryUpload(req.file.path);
=======
>>>>>>> 91687b9 (Complete Chinky backend fixes)

=======

>>>>>>> Stashed changes
            await removeTemporaryUpload(mediaFile.path);
            await removeTemporaryUpload(overlayFile?.path);
            return res.status(201).json({ success: true, data: post });
        } catch (_) {
            await removeTemporaryUpload(mediaFile.path);
            await removeTemporaryUpload(overlayFile?.path);
            return res.status(502).json({
                success: false,
                message: "Media could not be stored. Please try uploading again."
            });
        }
    } catch (err) {
        await removeTemporaryUpload(mediaFile?.path);
        await removeTemporaryUpload(overlayFile?.path);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUploadStatus = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        const uploadKey = String(req.params.key || "").trim();
        if (!uploadKey) return res.json({ success: true, found: false });
        const item = await Post.findOne({ user: req.user.id, uploadKey }).select("_id").lean();
        return res.json({ success: true, found: Boolean(item), id: item?._id || null });
    } catch (_) {
        return res.status(500).json({ success: false, found: false });
    }
};

// ======================================
// GET FLOW
// ======================================

exports.getFlow = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        const limit = Math.min(Math.max(Number(req.query.limit) || 30, 10), 50);
        const viewerId =
            req.user.id ||
            req.user._id ||
            req.user.userId;

        const posts = await Post.find()
            .populate(
                "user",
                "name username profileImage verified isPrivate isDeactivated followers"
            )
            .sort({
                createdAt: -1
            })
            // Over-fetch because private posts may be removed below.
            .limit(limit * 2);

        const visiblePosts = posts.filter((post) => {
            const owner = post.user;

            if (!owner || owner.isDeactivated) return false;

            if (!owner.isPrivate) {
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
