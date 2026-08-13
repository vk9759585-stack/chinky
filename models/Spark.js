const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        uploadKey: { type: String, default: "", index: true, select: false },

        caption: {
            type: String,
            default: ""
        },

        video: {
            type: String,
            required: true
        },

        videoPublicId: {
            type: String,
            default: ""
        },

        thumbnail: {
            type: String,
            default: ""
        },

        music: {
            type: String,
            default: ""
        },

        audio: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Audio",
            default: null
        },

        filter: {
            type: String,
            default: "Original"
        },

        edit: {
            filter: { type: String, default: "Original" },
            effect: { type: String, default: "None", maxlength: 30 },
            brightness: { type: Number, default: 0, min: -0.5, max: 0.5 },
            contrast: { type: Number, default: 1, min: 0.5, max: 1.8 },
            saturation: { type: Number, default: 1, min: 0, max: 2 },
            warmth: { type: Number, default: 0, min: -1, max: 1 },
            blur: { type: Number, default: 0, min: 0, max: 10 },
            vignette: { type: Number, default: 0, min: 0, max: 1 },
            grain: { type: Number, default: 0, min: 0, max: 1 },
            beauty: { type: Number, default: 0, min: 0, max: 1 },
            aspectRatio: { type: String, enum: ["Original", "9:16", "1:1", "4:5", "16:9"], default: "Original" },
            rotationQuarterTurns: { type: Number, default: 0, min: 0, max: 3 },
            flipHorizontal: { type: Boolean, default: false },
            overlayText: { type: String, default: "", maxlength: 80 },
            overlayX: { type: Number, default: 0.5, min: 0, max: 1 },
            overlayY: { type: Number, default: 0.5, min: 0, max: 1 },
            sticker: { type: String, default: "", maxlength: 8 },
            stickerX: { type: Number, default: 0.78, min: 0, max: 1 },
            stickerY: { type: Number, default: 0.28, min: 0, max: 1 },
            overlayImageUrl: { type: String, default: "" },
            overlayImageX: { type: Number, default: 0.5, min: 0, max: 1 },
            overlayImageY: { type: Number, default: 0.45, min: 0, max: 1 },
            overlayImageScale: { type: Number, default: 0.38, min: 0.12, max: 0.9 },
            captionText: { type: String, default: "", maxlength: 140 },
            audioTitle: { type: String, default: "Original audio", maxlength: 120 },
            audioId: { type: String, default: "" },
            audioStreamUrl: { type: String, default: "" },
            muted: { type: Boolean, default: false },
            volume: { type: Number, default: 1, min: 0, max: 1 },
            playbackSpeed: { type: Number, default: 1, min: 0.5, max: 2 },
            trimStartMs: { type: Number, default: 0, min: 0 },
            trimEndMs: { type: Number, default: 0, min: 0 },
            exportQuality: { type: String, enum: ["480P", "720P", "1080P"], default: "720P" }
        },

        duration: {
            type: Number,
            default: 0
        },

        location: {
            type: String,
            default: ""
        },

        taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        products: [{ type: String }],

        hashtags: [String],

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SparkComment"
            }
        ],

        shares: {
            type: Number,
            default: 0
        },

        views: {
            type: Number,
            default: 0
        },

        viewedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        saves: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        isTrending: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

reelSchema.index({ user: 1, createdAt: -1 });
reelSchema.index({ taggedUsers: 1, createdAt: -1 });
reelSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
    "Spark",
    reelSchema
);
