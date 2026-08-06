const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        image: {
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

        location: {
            type: String,
            default: ""
        },

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

module.exports = mongoose.model(
    "Post",
    postSchema
);