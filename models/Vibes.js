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