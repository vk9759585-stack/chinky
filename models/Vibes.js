const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

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
            brightness: { type: Number, default: 0, min: -0.5, max: 0.5 },
            contrast: { type: Number, default: 1, min: 0.5, max: 1.8 },
            saturation: { type: Number, default: 1, min: 0, max: 2 },
            overlayText: { type: String, default: "", maxlength: 80 },
            overlayX: { type: Number, default: 0.5, min: 0, max: 1 },
            overlayY: { type: Number, default: 0.5, min: 0, max: 1 },
            sticker: { type: String, default: "", maxlength: 8 },
            stickerX: { type: Number, default: 0.78, min: 0, max: 1 },
            stickerY: { type: Number, default: 0.28, min: 0, max: 1 },
            audioTitle: { type: String, default: "Original audio", maxlength: 120 },
            audioId: { type: String, default: "" },
            audioStreamUrl: { type: String, default: "" },
            muted: { type: Boolean, default: false },
            playbackSpeed: { type: Number, default: 1, min: 0.5, max: 2 },
            trimStartMs: { type: Number, default: 0, min: 0 },
            trimEndMs: { type: Number, default: 0, min: 0 }
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
