const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        ipAddress: {
            type: String,
            default: ""
        },

        device: {
            type: String,
            default: ""
        },

        browser: {
            type: String,
            default: ""
        },

        operatingSystem: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            default: ""
        },

        loginMethod: {
            type: String,
            enum: [
                "email",
                "phone",
                "username",
                "otp"
            ],
            default: "email"
        },

        status: {
            type: String,
            enum: [
                "success",
                "failed"
            ],
            default: "success"
        }
    },
    {
        timestamps: true
    }
);

loginHistorySchema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "LoginHistory",
    loginHistorySchema
);