const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
{
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    targetPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },

    targetSpark: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Spark",
    },

    targetComment: {
        type: mongoose.Schema.Types.ObjectId,
    },

    targetMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },

    targetType: { type: String, enum: ["post_comment", "spark_comment", "chat_message"] },

    reason: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        default: "pending",
    },
},
{
    timestamps: true,
}
);

module.exports = mongoose.model(
    "Report",
    reportSchema,
);