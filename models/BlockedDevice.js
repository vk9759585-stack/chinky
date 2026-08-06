const mongoose = require("mongoose");

const blockedDeviceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        deviceId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        reason: {
            type: String,
            default: "",
            trim: true
        },

        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

blockedDeviceSchema.index(
    {
        user: 1,
        deviceId: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "BlockedDevice",
    blockedDeviceSchema
);