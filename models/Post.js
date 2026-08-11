const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        uploadKey: { type: String, default: "", index: true, select: false },

        image: {
            type: String,
            default: ""
        },

        thumbnail: {
            type: String,
            default: ""
        },

        mediaType: {
            type: String,
            enum: ["image", "video"],
            default: "image"
        },

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
<<<<<<< HEAD
=======
            effect: { type: String, default: "None", maxlength: 30 },
>>>>>>> 91687b9 (Complete Chinky backend fixes)
            brightness: { type: Number, default: 0, min: -0.5, max: 0.5 },
            contrast: { type: Number, default: 1, min: 0.5, max: 1.8 },
            saturation: { type: Number, default: 1, min: 0, max: 2 },
            overlayText: { type: String, default: "", maxlength: 80 },
            overlayX: { type: Number, default: 0.5, min: 0, max: 1 },
            overlayY: { type: Number, default: 0.5, min: 0, max: 1 },
            sticker: { type: String, default: "", maxlength: 8 },
            stickerX: { type: Number, default: 0.78, min: 0, max: 1 },
            stickerY: { type: Number, default: 0.28, min: 0, max: 1 },
<<<<<<< HEAD
=======
            overlayImageUrl: { type: String, default: "" },
            overlayImageX: { type: Number, default: 0.5, min: 0, max: 1 },
            overlayImageY: { type: Number, default: 0.45, min: 0, max: 1 },
            overlayImageScale: { type: Number, default: 0.38, min: 0.12, max: 0.9 },
            captionText: { type: String, default: "", maxlength: 140 },
>>>>>>> 91687b9 (Complete Chinky backend fixes)
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

        location: {
            type: String,
            default: ""
        },

        taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        products: [{ type: String }],

        hashtags: [
            {
                type: String
            }
        ],

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ],

        saves: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        views: {
            type: Number,
            default: 0
        },

        viewedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        shares: {
            type: Number,
            default: 0
        },

        isEdited: {
            type: Boolean,
            default: false
        },

        isArchived: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

postSchema.index({
    user: 1,
    createdAt: -1
});

postSchema.index({
    taggedUsers: 1,
    createdAt: -1
});

postSchema.index({
    createdAt: -1
});

module.exports = mongoose.model(
    "Post",
    postSchema
);
