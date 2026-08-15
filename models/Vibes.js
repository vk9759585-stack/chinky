const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        uploadKey: { type: String, default: "", index: true, select: false },

        media: {
            type: String,
            required: true
        },

        isVideo: {
            type: Boolean,
            default: false
        },

        views: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        caption: {
            type: String,
            default: ""
        },

        filter: {
            type: String,
            default: "Original"
        },

        audioTitle: {
            type: String,
            default: "Original audio"
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
            exposure: { type: Number, default: 0, min: -1, max: 1 },
            highlights: { type: Number, default: 0, min: -1, max: 1 },
            shadows: { type: Number, default: 0, min: -1, max: 1 },
            whites: { type: Number, default: 0, min: -1, max: 1 },
            blacks: { type: Number, default: 0, min: -1, max: 1 },
            tint: { type: Number, default: 0, min: -1, max: 1 },
            sharpness: { type: Number, default: 0, min: 0, max: 1 },
            aspectRatio: { type: String, enum: ["Original", "9:16", "1:1", "4:5", "16:9"], default: "Original" },
            cropScale: { type: Number, default: 1, min: 1, max: 3 },
            cropX: { type: Number, default: 0, min: -1, max: 1 },
            cropY: { type: Number, default: 0, min: -1, max: 1 },
            straightenDegrees: { type: Number, default: 0, min: -15, max: 15 },
            rotationQuarterTurns: { type: Number, default: 0, min: 0, max: 3 },
            flipHorizontal: { type: Boolean, default: false },
            flipVertical: { type: Boolean, default: false },
            overlayText: { type: String, default: "", maxlength: 80 },
            overlayX: { type: Number, default: 0.5, min: 0, max: 1 },
            overlayY: { type: Number, default: 0.5, min: 0, max: 1 },
            textSize: { type: Number, default: 22, min: 12, max: 48 },
            textOpacity: { type: Number, default: 1, min: 0.2, max: 1 },
            textBackgroundOpacity: { type: Number, default: 0.38, min: 0, max: 0.9 },
            textRotationDegrees: { type: Number, default: 0, min: -180, max: 180 },
            textShadow: { type: Number, default: 0.5, min: 0, max: 1 },
            textStroke: { type: Number, default: 0, min: 0, max: 1 },
            sticker: { type: String, default: "", maxlength: 8 },
            stickerX: { type: Number, default: 0.78, min: 0, max: 1 },
            stickerY: { type: Number, default: 0.28, min: 0, max: 1 },
            stickerScale: { type: Number, default: 1, min: 0.5, max: 2.5 },
            stickerRotationDegrees: { type: Number, default: 0, min: -180, max: 180 },
            stickerOpacity: { type: Number, default: 1, min: 0.1, max: 1 },
            overlayImageUrl: { type: String, default: "" },
            overlayImageX: { type: Number, default: 0.5, min: 0, max: 1 },
            overlayImageY: { type: Number, default: 0.45, min: 0, max: 1 },
            overlayImageScale: { type: Number, default: 0.38, min: 0.12, max: 0.9 },
            overlayImageRotationDegrees: { type: Number, default: 0, min: -180, max: 180 },
            overlayImageOpacity: { type: Number, default: 1, min: 0.1, max: 1 },
            captionText: { type: String, default: "", maxlength: 140 },
            audioTitle: { type: String, default: "Original audio", maxlength: 120 },
            audioId: { type: String, default: "" },
            audioStreamUrl: { type: String, default: "" },
            muted: { type: Boolean, default: false },
            volume: { type: Number, default: 1, min: 0, max: 1 },
            originalVolume: { type: Number, default: 1, min: 0, max: 1 },
            musicVolume: { type: Number, default: 0.8, min: 0, max: 1 },
            musicStartMs: { type: Number, default: 0, min: 0 },
            playbackSpeed: { type: Number, default: 1, min: 0.5, max: 2 },
            trimStartMs: { type: Number, default: 0, min: 0 },
            trimEndMs: { type: Number, default: 0, min: 0 },
            exportQuality: { type: String, enum: ["480P", "720P", "1080P"], default: "720P" }
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "VibesComment"
            }
        ],

        shares: {
            type: Number,
            default: 0
        },

        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    },
    {
        timestamps: true
    }
);

storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1, createdAt: -1 });

module.exports = mongoose.model(
    "Story",
    storySchema
);
