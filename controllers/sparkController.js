const mongoose = require("mongoose");
const Spark = require("../models/Spark");
const Report = require("../models/Report");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const Wallet = require("../models/Wallet");
const Gift = require("../models/Gift");
const Audio = require("../models/Audio");
const { createSocialNotification } = require("../services/socialNotificationService");
const { SPARK_GIFT_MIN_FOLLOWERS, splitCoins, getGift } = require('../config/monetization');
const { changeCoins, creditCreatorEarnings, runFinancialTransaction } = require('../services/walletAccountingService');

const sparkThumbnail = (upload) => {
    if (!upload || !upload.public_id) return "";
    try {
        return cloudinary.url(upload.public_id, {
            resource_type: "video",
            secure: true,
            format: "jpg",
            transformation: [{ width: 720, height: 1280, crop: "fill", gravity: "auto" }]
        });
    } catch (_) {
        return "";
    }
};

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

const absoluteMediaUrl = (req, value) => {
    const url = String(value || "");
    return url.startsWith("/") ? `${req.protocol}://${req.get("host")}${url}` : url;
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
// CREATE SPARK
// ======================================

exports.createSpark = async (req, res) => {
    const videoFile = req.files?.video?.[0];
    const overlayFile = req.files?.overlay?.[0];
    const uploadKey = String(req.body.clientUploadId || "").trim().slice(0, 160);
    try {
        if (uploadKey) {
            const existing = await Spark.findOne({ user: req.user.id, uploadKey });
            if (existing) {
                await fs.promises.unlink(videoFile?.path || "").catch(() => {});
                await fs.promises.unlink(overlayFile?.path || "").catch(() => {});
                return res.status(200).json({ success: true, data: existing, duplicate: true });
            }
        }
        if (!videoFile) {
            await fs.promises.unlink(overlayFile?.path || "").catch(() => {});
            return res.status(400).json({ success: false, message: "Spark video is required" });
        }

        const edit = editFromBody(req.body.edit, req.body.filter || "Original");
        const qualityWidth = edit.exportQuality === "1080P" ? 1080 : edit.exportQuality === "480P" ? 480 : 720;
        let videoUrl = "";
        let videoPublicId = "";
        let thumbnail = (req.body.thumbnail || "").trim();

        try {
            const upload = await cloudinary.uploader.upload(videoFile.path, {
                resource_type: "video",
                folder: "chinky/sparks",
                transformation: [{ width: qualityWidth, crop: "limit" }]
            });
            videoUrl = upload.secure_url;
            videoPublicId = upload.public_id || "";
            if (!thumbnail) thumbnail = sparkThumbnail(upload);
            await fs.promises.unlink(videoFile.path).catch(() => {});
        } catch (_) {
            videoUrl = `${req.protocol}://${req.get("host")}/uploads/${videoFile.filename}`;
        }

        if (overlayFile) {
            try {
                const overlayUpload = await cloudinary.uploader.upload(overlayFile.path, {
                    resource_type: "image",
                    folder: "chinky/overlays",
                    transformation: [{ width: 1200, crop: "limit" }]
                });
                edit.overlayImageUrl = overlayUpload.secure_url || "";
                await fs.promises.unlink(overlayFile.path).catch(() => {});
            } catch (_) {
                await fs.promises.unlink(overlayFile.path).catch(() => {});
                return res.status(502).json({ success: false, message: "Overlay image could not be stored." });
            }
        }

        const spark = await Spark.create({
            user: req.user.id,
            uploadKey,
            caption: req.body.caption || "",
            video: videoUrl,
            videoPublicId,
            thumbnail,
            music: req.body.music || "",
            audio: req.body.audioId || null,
            filter: req.body.filter || "Original",
            edit,
            duration: Number(req.body.duration) || 0,
            hashtags: listFromBody(req.body.hashtags),
            location: req.body.location || "",
            taggedUsers: listFromBody(req.body.taggedUsers),
            products: listFromBody(req.body.products),
            remixOf: mongoose.Types.ObjectId.isValid(String(req.body.remixOf || '')) ? req.body.remixOf : null,
            remixType: ['duet','remix'].includes(String(req.body.remixType || '')) ? req.body.remixType : 'none'
        });

        if (req.body.audioId) {
            await Audio.updateOne({ _id: req.body.audioId, reusable: true, blocked: false }, { $inc: { usageCount: 1 } }).catch(() => {});
        } else if (videoPublicId) {
            try {
                const audioUrl = cloudinary.url(videoPublicId, { resource_type: "video", secure: true, format: "mp3" });
                const audio = await Audio.create({
                    owner: req.user.id,
                    sourceSpark: spark._id,
                    title: req.body.music && req.body.music !== "Mute" ? req.body.music : "Original audio",
                    streamUrl: audioUrl,
                    duration: Number(req.body.duration) || 0,
                    coverUrl: thumbnail,
                    isOriginal: true,
                    reusable: true
                });
                spark.audio = audio._id;
                await spark.save();
            } catch (_) {}
        }

        return res.status(201).json({ success: true, data: spark });
    } catch (err) {
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
        const item = await Spark.findOne({ user: req.user.id, uploadKey }).select("_id").lean();
        return res.json({ success: true, found: Boolean(item), id: item?._id || null });
    } catch (_) {
        return res.status(500).json({ success: false, found: false });
    }
};

// ======================================
// GET SPARKS
// ======================================

exports.getSparks = async (req, res) => {
    try {
        // Spark feed must reflect a newly published Spark immediately. Prevent
        // proxies/clients from reusing a stale list response.
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        const viewerId = (req.user.id || req.user._id || req.user.userId).toString();
        const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 30);
        const before = req.query.before ? new Date(req.query.before) : null;
        const filter = before && !Number.isNaN(before.getTime()) ? { createdAt: { $lt: before } } : {};

        // Fetch a small page instead of loading the whole Spark collection.
        // A little over-fetch helps after private-account filtering.
        const sparks = await Spark.find(filter)
            .populate("user", "name username profileImage verified isPrivate isDeactivated followers")
            .populate("audio", "title artistName streamUrl duration coverUrl owner usageCount")
            .sort({ createdAt: -1 })
            .limit(limit * 2)
            .lean();

        const visible = [];
        for (const spark of sparks) {
            const owner = spark.user;
            if (!owner || owner.isDeactivated) continue;
            const followers = Array.isArray(owner.followers) ? owner.followers : [];
            const canView = !owner.isPrivate || owner._id.toString() === viewerId || followers.some((id) => id.toString() === viewerId);
            if (!canView) continue;

            const data = { ...spark, user: { ...owner } };
            if (data.audio?.streamUrl) data.audio.streamUrl = absoluteMediaUrl(req, data.audio.streamUrl);
            data.creatorFollowerCount = followers.length;
            data.isFollowing = followers.some((id) => id.toString() === viewerId);
            data.liked = (spark.likes || []).some((id) => id.toString() === viewerId);
            data.saved = (spark.saves || []).some((id) => id.toString() === viewerId);
            delete data.viewedBy;
            delete data.user.followers;
            visible.push(data);
            if (visible.length >= limit) break;
        }

        return res.json({
            success: true,
            count: visible.length,
            data: visible,
            nextCursor: visible.length ? visible[visible.length - 1].createdAt : null
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// LIKE SPARK
// ======================================

exports.likeSpark = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id);
        if (!spark) return res.status(404).json({ success: false, message: "Spark not found" });

        const userId = (req.user.id || req.user._id || req.user.userId).toString();
        const currentlyLiked = spark.likes.some((id) => id.toString() === userId);
        const desired = typeof req.body?.liked === "boolean" ? req.body.liked : !currentlyLiked;

        if (desired && !currentlyLiked) spark.likes.addToSet(userId);
        if (!desired && currentlyLiked) spark.likes.pull(userId);
        await spark.save();
        if (desired && spark.user.toString() !== userId) {
            await createSocialNotification(req, {
                sender: userId,
                receiver: spark.user,
                type: "spark_like",
                title: "New Spark like",
                body: "liked your Spark",
                link: `/spark/${spark._id}`
            }).catch(() => {});
        }

        return res.json({ success: true, liked: desired, likes: spark.likes.length });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// SAVE SPARK
// ======================================

exports.saveSpark = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id);
        if (!spark) return res.status(404).json({ success: false, message: "Spark not found" });

        const userId = (req.user.id || req.user._id || req.user.userId).toString();
        const currentlySaved = spark.saves.some((id) => id.toString() === userId);
        const desired = typeof req.body?.saved === "boolean" ? req.body.saved : !currentlySaved;

        if (desired && !currentlySaved) spark.saves.addToSet(userId);
        if (!desired && currentlySaved) spark.saves.pull(userId);
        await spark.save();

        return res.json({ success: true, saved: desired, saves: spark.saves.length });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// ADD VIEW
// ======================================

exports.addView = async (req, res) => {
    try {
        const userId = (req.user.id || req.user._id || req.user.userId).toString();
        const spark = await Spark.findOneAndUpdate(
            { _id: req.params.id, viewedBy: { $ne: userId } },
            { $addToSet: { viewedBy: userId }, $inc: { views: 1 } },
            { new: true }
        );
        if (spark) return res.json({ success: true, views: spark.views, counted: true });
        const existing = await Spark.findById(req.params.id).select("views");
        if (!existing) return res.status(404).json({ success: false, message: "Spark not found" });
        return res.json({ success: true, views: existing.views, counted: false });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// SHARE SPARK
// ======================================

exports.shareSpark = async (req, res) => {
    try {
        const spark = await Spark.findByIdAndUpdate(
            req.params.id,
            { $inc: { shares: 1 } },
            { new: true }
        ).select("shares");

        if (!spark) {
            return res.status(404).json({
                success: false,
                message: "Spark not found"
            });
        }

        return res.json({
            success: true,
            shares: spark.shares
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteSpark = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id).select("user video thumbnail");
        if (!spark) {
            return res.status(404).json({ success: false, message: "Spark not found" });
        }
        if (spark.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "You can only delete your own Spark" });
        }

        if (spark.videoPublicId) {
            try {
                await cloudinary.uploader.destroy(spark.videoPublicId, { resource_type: "video" });
            } catch (_) {}
        }

        await Spark.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: "Spark deleted" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.reportSpark = async (req, res) => {
    try {
        const spark = await Spark.findById(req.params.id).select("user");
        if (!spark) {
            return res.status(404).json({ success: false, message: "Spark not found" });
        }

        const reason = (req.body.reason || "").trim();
        if (!reason) {
            return res.status(400).json({ success: false, message: "Reason is required" });
        }

        await Report.create({
            reporter: req.user.id,
            targetUser: spark.user,
            targetSpark: spark._id,
            reason,
            status: "pending",
        });

        return res.json({ success: true, message: "Report submitted" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.sendGift = async (req, res) => {
    try {
        const selectedGift = getGift(req.body.giftName);
        const cost = selectedGift?.coins;
        if (!cost) return res.status(400).json({ success: false, message: "Invalid gift" });
        const spark = await Spark.findById(req.params.id).populate("user", "followers");
        if (!spark) return res.status(404).json({ success: false, message: "Spark not found" });
        if (spark.user._id.toString() === req.user.id) return res.status(400).json({ success: false, message: "You cannot send a gift to yourself" });
        const { creatorCoins, platformCoins } = splitCoins(cost);
        const result = await runFinancialTransaction(async (session) => {
            const gift = await Gift.create([{
                sender: req.user.id,
                receiver: spark.user._id,
                giftName: req.body.giftName,
                coins: cost,
                sourceType: 'spark',
                sourceId: spark._id.toString(),
                creatorShareCoins: creatorCoins,
                platformShareCoins: platformCoins,
            }], { session });
            const referenceId = gift[0]._id.toString();
            const senderWallet = await changeCoins({
                user: req.user.id, delta: -cost, transactionType: 'spark_gift_sent',
                referenceType: 'gift', referenceId, metadata: { sparkId: spark._id.toString(), giftName: req.body.giftName }, session,
            });
            await creditCreatorEarnings({
                user: spark.user._id, coins: creatorCoins, transactionType: 'spark_gift_received',
                referenceType: 'gift', referenceId, metadata: { sparkId: spark._id.toString(), giftName: req.body.giftName }, session,
            });
            return { gift: gift[0], coins: senderWallet.coins };
        });
        return res.json({ success: true, coins: result.coins, gift: { id: result.gift._id, name: result.gift.giftName, coins: result.gift.coins } });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};
