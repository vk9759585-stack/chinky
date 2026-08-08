const mongoose = require("mongoose");

const vibesCommentSchema = new mongoose.Schema(
    {
        vibe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Story",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VibesComment",
            default: null
        },
        comment: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

vibesCommentSchema.index({ vibe: 1, createdAt: -1 });
vibesCommentSchema.index({ parentComment: 1, createdAt: 1 });

module.exports = mongoose.model("VibesComment", vibesCommentSchema);
