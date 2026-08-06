const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        otp: {
            type: String,
            required: true
        },

        purpose: {
            type: String,
            enum: [
                "register",
                "login",
                "forgot_password",
                "change_email",
                "change_phone",
                "verification"
            ],
            default: "login"
        },

        attempts: {
            type: Number,
            default: 0
        },

        verified: {
            type: Boolean,
            default: false
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

otpSchema.index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
);

module.exports = mongoose.model(
    "Otp",
    otpSchema
);