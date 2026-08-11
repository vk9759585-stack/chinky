const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

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
