const mongoose = require("mongoose");

const reelCommentSchema = new mongoose.Schema(
    {
        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Spark",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SparkComment",
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
        ]
    },
    {
        timestamps: true
    }
);

reelCommentSchema.index({ reel: 1, createdAt: -1 });
reelCommentSchema.index({ parentComment: 1, createdAt: 1 });

module.exports = mongoose.model(
    "SparkComment",
    reelCommentSchema
);