const Vibes = require("../models/Vibes");
const VibesComment = require("../models/VibesComment");
const { canInteract, isCommentFiltered } = require("../services/privacyGuardService");
const cloudinary = require("../config/cloudinary");
const {
    uploadOptions: moderationUploadOptions,
    moderationStatus,
    isRejected: moderationRejected
} = require("../services/contentModerationService");
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
        effect: String(raw.effect || "None").slice(0, 30),
        brightness: number("brightness", 0, -0.5, 0.5),
        contrast: number("contrast", 1, 0.5, 1.8),
        saturation: number("saturation", 1, 0, 2),
        warmth: number("warmth", 0, -1, 1),
        blur: number("blur", 0, 0, 10),
        vignette: number("vignette", 0, 0, 1),
        grain: number("grain", 0, 0, 1),
        beauty: number("beauty", 0, 0, 1),
        exposure: number("exposure", 0, -1, 1),
        highlights: number("highlights", 0, -1, 1),
        shadows: number("shadows", 0, -1, 1),
        whites: number("whites", 0, -1, 1),
        blacks: number("blacks", 0, -1, 1),
        tint: number("tint", 0, -1, 1),
        sharpness: number("sharpness", 0, 0, 1),
        aspectRatio: ["Original", "9:16", "1:1", "4:5", "16:9"].includes(String(raw.aspectRatio || "Original"))
            ? String(raw.aspectRatio || "Original") : "Original",
        cropScale: number("cropScale", 1, 1, 3),
        cropX: number("cropX", 0, -1, 1),
        cropY: number("cropY", 0, -1, 1),
        straightenDegrees: number("straightenDegrees", 0, -15, 15),
        rotationQuarterTurns: Math.round(number("rotationQuarterTurns", 0, 0, 3)),
        flipHorizontal: raw.flipHorizontal === true,
        flipVertical: raw.flipVertical === true,
        overlayText: String(raw.overlayText || "").trim().slice(0, 80),
        overlayX: number("overlayX", 0.5, 0, 1),
        overlayY: number("overlayY", 0.5, 0, 1),
        textSize: number("textSize", 22, 12, 48),
        textOpacity: number("textOpacity", 1, 0.2, 1),
        textBackgroundOpacity: number("textBackgroundOpacity", 0.38, 0, 0.9),
        textRotationDegrees: number("textRotationDegrees", 0, -180, 180),
        textShadow: number("textShadow", 0.5, 0, 1),
        textStroke: number("textStroke", 0, 0, 1),
        sticker: String(raw.sticker || "").slice(0, 8),
        stickerX: number("stickerX", 0.78, 0, 1),
        stickerY: number("stickerY", 0.28, 0, 1),
        stickerScale: number("stickerScale", 1, 0.5, 2.5),
        stickerRotationDegrees: number("stickerRotationDegrees", 0, -180, 180),
        stickerOpacity: number("stickerOpacity", 1, 0.1, 1),
        overlayImageUrl: String(raw.overlayImageUrl || "").slice(0, 2000),
        overlayImageX: number("overlayImageX", 0.5, 0, 1),
        overlayImageY: number("overlayImageY", 0.45, 0, 1),
        overlayImageScale: number("overlayImageScale", 0.38, 0.12, 0.9),
        overlayImageRotationDegrees: number("overlayImageRotationDegrees", 0, -180, 180),
        overlayImageOpacity: number("overlayImageOpacity", 1, 0.1, 1),
        captionText: String(raw.captionText || "").trim().slice(0, 140),
        audioTitle: String(raw.audioTitle || "Original audio").slice(0, 120),
        audioId: String(raw.audioId || "").slice(0, 80),
        audioStreamUrl: String(raw.audioStreamUrl || "").slice(0, 2000),
        muted: raw.muted === true,
        volume: number("volume", 1, 0, 1),
        originalVolume: number(
            "originalVolume",
            String(raw.audioStreamUrl || "").trim() ? 0 : number("volume", 1, 0, 1),
            0,
            1
        ),
        musicVolume: number("musicVolume", number("volume", 0.8, 0, 1), 0, 1),
        musicStartMs: Math.round(number("musicStartMs", 0, 0, 86400000)),
        playbackSpeed: number("playbackSpeed", 1, 0.5, 2),
        trimStartMs: Math.round(number("trimStartMs", 0, 0, 86400000)),
        trimEndMs: Math.round(number("trimEndMs", 0, 0, 86400000)),
        exportQuality: ["480P", "720P", "1080P"].includes(String(raw.exportQuality || "720P").toUpperCase())
            ? String(raw.exportQuality || "720P").toUpperCase()
            : "720P"
    };
};

// ======================================
// GET VIBES
// ======================================

exports.getVibes = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 40, 10), 60);
        const viewerId = req.user.id.toString();
        const vibes = await Vibes.find({
            expiresAt: { $gt: new Date() },
            $or: [
                { moderationStatus: { $exists: false } },
                { moderationStatus: "approved" },
                { moderationStatus: "pending", user: viewerId }
            ]
        })
            .populate("user", "name username profileImage verified isPrivate isDeactivated followers")
            .sort({ createdAt: -1 })
            .limit(limit * 2);

        const data = vibes
            .filter((vibe) => {
                const owner = vibe.user;
                if (!owner || owner.isDeactivated) return false;
                return (
                    !owner.isPrivate ||
                    owner._id.toString() === viewerId ||
                    owner.followers.some((id) => id.toString() === viewerId)
                );
            })
            .sort((a, b) => {
                const aMine = a.user?._id?.toString() === viewerId;
                const bMine = b.user?._id?.toString() === viewerId;
                if (aMine !== bMine) return aMine ? -1 : 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
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
    const mediaFile = req.files?.story?.[0];
    const overlayFile = req.files?.overlay?.[0];
    const uploadKey = String(req.body.clientUploadId || "").trim().slice(0, 160);
    try {
        if (uploadKey) {
            const existing = await Vibes.findOne({ user: req.user.id, uploadKey });
            if (existing) {
                await fs.promises.unlink(mediaFile?.path || "").catch(() => {});
                await fs.promises.unlink(overlayFile?.path || "").catch(() => {});
                return res.status(200).json({ success: true, data: existing, duplicate: true });
            }
        }
        if (!mediaFile) {
            await fs.promises.unlink(overlayFile?.path || "").catch(() => {});
            return res.status(400).json({ success: false, message: "Vibes media is required" });
        }

        const isVideo = mediaFile.mimetype.startsWith("video/");
        const edit = editFromBody(req.body.edit, req.body.filter || "Original");
        const qualityWidth = edit.exportQuality === "1080P" ? 1080 : edit.exportQuality === "480P" ? 480 : 720;
        try {
            const upload = await cloudinary.uploader.upload(mediaFile.path, {
                resource_type: isVideo ? "video" : "image",
                folder: "chinky/vibes",
                transformation: [{ width: qualityWidth, crop: "limit" }],
                ...moderationUploadOptions(isVideo ? "video" : "image")
            });

            if (moderationRejected(upload)) {
                await cloudinary.uploader.destroy(upload.public_id, {
                    resource_type: isVideo ? "video" : "image",
                    invalidate: true
                }).catch(() => {});
                await fs.promises.unlink(mediaFile.path).catch(() => {});
                await fs.promises.unlink(overlayFile?.path || "").catch(() => {});
                return res.status(422).json({
                    success: false,
                    code: "sexual_content_detected",
                    message: "Vibe removed: sexual or adult content is not allowed."
                });
            }

            if (overlayFile) {
                const overlayUpload = await cloudinary.uploader.upload(overlayFile.path, {
                    resource_type: "image",
                    folder: "chinky/overlays",
                    transformation: [{ width: 1200, crop: "limit" }],
                    ...moderationUploadOptions("image")
                });
                if (moderationRejected(overlayUpload)) {
                    await cloudinary.uploader.destroy(overlayUpload.public_id, {
                        resource_type: "image",
                        invalidate: true
                    }).catch(() => {});
                    await cloudinary.uploader.destroy(upload.public_id, {
                        resource_type: isVideo ? "video" : "image",
                        invalidate: true
                    }).catch(() => {});
                    await fs.promises.unlink(mediaFile.path).catch(() => {});
                    await fs.promises.unlink(overlayFile.path).catch(() => {});
                    return res.status(422).json({
                        success: false,
                        code: "sexual_content_detected",
                        message: "Vibe removed: sexual or adult content is not allowed."
                    });
                }
                edit.overlayImageUrl = overlayUpload.secure_url || "";
            }

            await fs.promises.unlink(mediaFile.path).catch(() => {});
            await fs.promises.unlink(overlayFile?.path || "").catch(() => {});

            const vibe = await Vibes.create({
                user: req.user.id,
                uploadKey,
                media: upload.secure_url,
                mediaPublicId: upload.public_id || "",
                moderationStatus: moderationStatus(upload),
                moderationKind: isVideo ? "aws_rek_video" : "aws_rek",
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
            await fs.promises.unlink(mediaFile.path).catch(() => {});
            await fs.promises.unlink(overlayFile?.path || "").catch(() => {});
            return res.status(502).json({ success: false, message: "Vibes media could not be stored. Please retry." });
        }
    } catch (err) {
        await fs.promises.unlink(mediaFile?.path || "").catch(() => {});
        await fs.promises.unlink(overlayFile?.path || "").catch(() => {});
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
        const item = await Vibes.findOne({ user: req.user.id, uploadKey }).select("_id").lean();
        return res.json({ success: true, found: Boolean(item), id: item?._id || null });
    } catch (_) {
        return res.status(500).json({ success: false, found: false });
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

        const vibe = await Vibes.findById(req.params.id).select("_id comments user");
        if (!vibe) return res.status(404).json({ success: false, message: "Vibes not found" });
        if (!(await canInteract(vibe.user, req.user.id, "comments"))) {
            return res.status(403).json({ success: false, message: "Comments are limited by this account's privacy settings" });
        }
        if (await isCommentFiltered(vibe.user, text)) {
            return res.status(400).json({ success: false, message: "This comment contains a blocked keyword" });
        }

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
        const vibe = await Vibes.findById(req.params.id).select("user").lean();
        if (!vibe) return res.status(404).json({ success: false, message: "Vibes not found" });
        if (!(await canInteract(vibe.user, req.user.id, "comments"))) {
            return res.status(403).json({ success: false, message: "Replies are limited by this account's privacy settings" });
        }
        if (await isCommentFiltered(vibe.user, text)) {
            return res.status(400).json({ success: false, message: "This reply contains a blocked keyword" });
        }

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
