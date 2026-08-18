const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "like",
                "comment",
                "follow",
                "message",
                "call",
                "live",
                "mention",
                "spark_like",
                "vibes_like",
                "club_invite",
                "verification",
                "support",
                "gift"
            ],
            required: true
        },

        title: {
            type: String,
            default: ""
        },

        body: {
            type: String,
            default: ""
        },

        image: {
            type: String,
            default: ""
        },

        link: {
            type: String,
            default: ""
        },

        isRead: {
            type: Boolean,
            default: false
        },

        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    receiver: 1,
    createdAt: -1
});

notificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);
