const Vibes = require("../models/Vibes");
const VibesComment = require("../models/VibesComment");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const Audio = require("../models/Audio");

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
    return {
        filter: String(raw.filter || fallbackFilter).slice(0, 30),
        brightness: number("brightness", 0, -0.5, 0.5),
        contrast: number("contrast", 1, 0.5, 1.8),
        saturation: number("saturation", 1, 0, 2),
        overlayText: String(raw.overlayText || "").trim().slice(0, 80),
        overlayX: number("overlayX", 0.5, 0, 1),
        overlayY: number("overlayY", 0.5, 0, 1),
        sticker: String(raw.sticker || "").slice(0, 8),
        stickerX: number("stickerX", 0.78, 0, 1),
        stickerY: number("stickerY", 0.28, 0, 1),
        audioTitle: String(raw.audioTitle || "Original audio").slice(0, 120),
        audioId: String(raw.audioId || "").slice(0, 80),
        audioStreamUrl: String(raw.audioStreamUrl || "").slice(0, 2000),
        muted: raw.muted === true,
        playbackSpeed: number("playbackSpeed", 1, 0.5, 2),
        trimStartMs: Math.round(number("trimStartMs", 0, 0, 86400000)),
        trimEndMs: Math.round(number("trimEndMs", 0, 0, 86400000))
    };
};

// ======================================
// GET VIBES
// ======================================

exports.getVibes = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 40, 10), 60);
        const viewerId = req.user.id.toString();
        const vibes = await Vibes.find({ expiresAt: { $gt: new Date() } })
            .populate("user", "name username profileImage verified isPrivate followers")
            .sort({ createdAt: -1 })
            .limit(limit * 2);

        const data = vibes
            .filter((vibe) => {
                const owner = vibe.user;
                if (!owner) return false;
                return (
                    !owner.isPrivate ||
                    owner._id.toString() === viewerId ||
                    owner.followers.some((id) => id.toString() === viewerId)
                );
            })
            .slice(0, limit)
            .map((vibe) => {
                const item = vibe.toObject();
                const ownerFollowers = vibe.user?.followers || [];
                if (item.user?.followers) delete item.user.followers;
                item.views = vibe.views.length;
                item.likes = vibe.likes.length;
                item.comments = vibe.comments.length;
                item.liked = vibe.likes.some((id) => id.toString() === viewerId);
                item.isFollowing = ownerFollowers.some((id) => id.toString() === viewerId);
                return item;
            });

        return res.json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// CREATE VIBES
// ======================================

exports.createVibes = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Vibes media is required" });
        }

        const isVideo = req.file.mimetype.startsWith("video/");
        try {
            const upload = await cloudinary.uploader.upload(req.file.path, {
                resource_type: isVideo ? "video" : "image",
                folder: "chinky/vibes"
            });

            await fs.promises.unlink(req.file.path).catch(() => {});

            const edit = editFromBody(req.body.edit, req.body.filter || "Original");
            const vibe = await Vibes.create({
                user: req.user.id,
                media: upload.secure_url,
                isVideo,
                caption: (req.body.caption || "").trim(),
                filter: edit.filter,
                audioTitle: edit.audioTitle,
                edit
            });

            if (edit.audioId) {
                await Audio.updateOne(
                    { _id: edit.audioId, reusable: true, blocked: false },
                    { $inc: { usageCount: 1 } }
                ).catch(() => {});
            }

            return res.status(201).json({ success: true, data: vibe });
        } catch (_) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(502).json({
                success: false,
                message: "Vibes media could not be stored. Please retry."
            });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// DELETE VIBES
// ======================================

exports.deleteVibes = async (req, res) => {
    try {
        const vibe = await Vibes.findById(
            req.params.id
        );

        if (!vibe) {
            return res.status(404).json({
                success: false,
                message: "Vibes not found"
            });
        }

        if (
            vibe.user.toString() !== req.user.id
        ) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        await Promise.all([
            Vibes.findByIdAndDelete(req.params.id),
            VibesComment.deleteMany({ vibe: req.params.id })
        ]);

        return res.json({
            success: true,
            message: "Vibes deleted successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.shareVibes = async (req, res) => {
    try {
        const vibe = await Vibes.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
        if (!vibe) return res.status(404).json({ success: false, message: "Vibes not found" });
        return res.json({ success: true, shares: vibe.shares });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


// ======================================
// VIBES ENGAGEMENT
// ======================================

exports.likeVibes = async (req, res) => {
    try {
        const vibe = await Vibes.findById(req.params.id);
        if (!vibe) return res.status(404).json({ success: false, message: "Vibes not found" });

        const userId = req.user.id.toString();
        const alreadyLiked = vibe.likes.some((id) => id.toString() === userId);
        if (alreadyLiked) vibe.likes.pull(userId);
        else vibe.likes.addToSet(userId);
        await vibe.save();

        return res.json({ success: true, liked: !alreadyLiked, likes: vibe.likes.length });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getComments = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
        const skip = (page - 1) * limit;
        const filter = { vibe: req.params.id };
        const [comments, total] = await Promise.all([
            VibesComment.find(filter)
                .populate("user", "name username profileImage verified")
                .populate("parentComment")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            VibesComment.countDocuments(filter)
        ]);
        return res.json({
            success: true,
            page,
            count: comments.length,
            total,
            hasMore: skip + comments.length < total,
            data: comments
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const text = req.body.comment?.trim();
        if (!text) return res.status(400).json({ success: false, message: "Comment cannot be empty" });

        const vibe = await Vibes.findById(req.params.id).select("_id comments");
        if (!vibe) return res.status(404).json({ success: false, message: "Vibes not found" });

        const comment = await VibesComment.create({ vibe: vibe._id, user: req.user.id, comment: text });
        vibe.comments.addToSet(comment._id);
        await vibe.save();
        const result = await VibesComment.findById(comment._id)
            .populate("user", "name username profileImage verified");
        return res.status(201).json({ success: true, data: result, comments: vibe.comments.length });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.addReply = async (req, res) => {
    try {
        const text = req.body.comment?.trim();
        if (!text) return res.status(400).json({ success: false, message: "Reply cannot be empty" });

        const parent = await VibesComment.findOne({ _id: req.params.commentId, vibe: req.params.id });
        if (!parent) return res.status(404).json({ success: false, message: "Vibes comment not found" });

        const reply = await VibesComment.create({
            vibe: req.params.id,
            user: req.user.id,
            parentComment: parent._id,
            comment: text
        });
        const result = await VibesComment.findById(reply._id)
            .populate("user", "name username profileImage verified")
            .populate("parentComment");
        return res.status(201).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
