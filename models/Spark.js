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
