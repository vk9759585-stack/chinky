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

        comment: {
            type: String,
            required: true
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

module.exports = mongoose.model(
    "SparkComment",
    reelCommentSchema
);