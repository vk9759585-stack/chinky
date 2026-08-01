const mongoose = require("mongoose");

const callSchema = new mongoose.Schema({

    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    type: {
        type: String,
        enum: ["voice", "video"],
        default: "voice"
    },

    status: {
        type: String,
        enum: [
            "calling",
            "ringing",
            "accepted",
            "rejected",
            "missed",
            "ended"
        ],
        default: "calling"
    },

    startedAt: Date,

    endedAt: Date,

    duration: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Call",
    callSchema
);