const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],

        lastMessage: {
            type: String,
            default: ""
        },

        lastMessageType: {
            type: String,
            enum: [
                "text",
                "image",
                "video",
                "audio",
                "voice",
                "file"
            ],
            default: "text"
        },

        lastSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        unreadCount: {
            type: Number,
            default: 0
        },

        muted: {
            type: Boolean,
            default: false
        },

        archived: {
            type: Boolean,
            default: false
        },

        blocked: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

conversationSchema.index({
    members: 1
});

conversationSchema.index({
    updatedAt: -1
});

module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);