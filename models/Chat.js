const mongoose = require("mongoose");

// ===============================
// REACTION SCHEMA
// ===============================

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

// ===============================
// CHAT SCHEMA
// ===============================

const chatSchema = new mongoose.Schema(
    {
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
            default: "",
            trim: true
        },

        type: {
            type: String,
            enum: [
                "text",
                "image",
                "voice",
                "video",
                "file",
                "location",
                "contact"
            ],
            default: "text"
        },

        image: {
            type: String,
            default: ""
        },

        voice: {
            type: String,
            default: ""
        },

        video: {
            type: String,
            default: ""
        },

        file: {
            type: String,
            default: ""
        },

        location: {
            latitude: {
                type: Number,
                default: 0
            },

            longitude: {
                type: Number,
                default: 0
            }
        },

        contact: {
            name: {
                type: String,
                default: ""
            },

            phone: {
                type: String,
                default: ""
            }
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            default: null
        },

        forwarded: {
            type: Boolean,
            default: false
        },

        edited: {
            type: Boolean,
            default: false
        },

        pinned: {
            type: Boolean,
            default: false
        },

        sent: {
            type: Boolean,
            default: true
        },

        delivered: {
            type: Boolean,
            default: false
        },

        seen: {
            type: Boolean,
            default: false
        },

        seenAt: {
            type: Date,
            default: null
        },

        reactions: [reactionSchema],

        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        deletedForEveryone: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// ===============================
// INDEXES
// ===============================

chatSchema.index({
    sender: 1,
    receiver: 1,
    createdAt: -1
});

// ===============================
// EXPORT
// ===============================

module.exports = mongoose.model(
    "Chat",
    chatSchema
);