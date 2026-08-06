const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        emoji: {
            type: String,
            default: "❤️"
        }
    },
    {
        _id: false
    }
);

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        message: {
            type: String,
            default: ""
        },

        image: {
            type: String,
            default: ""
        },

        video: {
            type: String,
            default: ""
        },

        audio: {
            type: String,
            default: ""
        },

        file: {
            type: String,
            default: ""
        },

        messageType: {
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

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        reactions: [reactionSchema],

        forwarded: {
            type: Boolean,
            default: false
        },

        edited: {
            type: Boolean,
            default: false
        },

        deleted: {
            type: Boolean,
            default: false
        },

        seen: {
            type: Boolean,
            default: false
        },

        delivered: {
            type: Boolean,
            default: false
        },

        seenAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index({
    conversation: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Message",
    messageSchema
);