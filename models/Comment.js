const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },

        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        },

        comment: {
            type: String,
            required: true,
            trim: true
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        edited: {
            type: Boolean,
            default: false
        },

        deleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

commentSchema.index({
    post: 1,
    createdAt: -1
});

commentSchema.index({
    parentComment: 1,
    createdAt: 1
});

module.exports = mongoose.model(
    "Comment",
    commentSchema
);
