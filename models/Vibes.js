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

        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Story",
    storySchema
);