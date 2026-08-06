const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        bio: {
            type: String,
            default: ""
        },

        gender: {
            type: String,
            default: ""
        },

        link: {
            type: String,
            default: ""
        },

        profileImage: {
            type: String,
            default: ""
        },

        coverImage: {
            type: String,
            default: ""
        },

        verified: {
            type: Boolean,
            default: false
        },

        banned: {
            type: Boolean,
            default: false
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        isPrivate: {
            type: Boolean,
            default: false
        },

        accountType: {
            type: String,
            enum: ["personal", "professional"],
            default: "personal"
        },

        verificationStatus: {
            type: String,
            enum: [
                "none",
                "pending",
                "verified",
                "rejected"
            ],
            default: "none"
        },

        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        blockedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        savedPosts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post"
            }
        ],

        otp: {
            type: String,
            default: ""
        },

        otpExpire: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);
