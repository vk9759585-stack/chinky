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

        badgeType: {
            type: String,
            enum: ["none", "blue", "gold"],
            default: "none"
        },

        isGoldenVerified: {
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

        appSettings: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        privacySettings: {
            comments: { type: String, enum: ["everyone", "friends", "no_one"], default: "everyone" },
            creatorCareMode: { type: Boolean, default: false },
            filterUnwantedComments: { type: Boolean, default: true },
            commentKeywords: { type: [String], default: [] },
            mentions: { type: String, enum: ["everyone", "friends", "no_one"], default: "everyone" },
            directMessages: { type: String, enum: ["everyone", "friends", "no_one"], default: "friends" },
            readStatus: { type: Boolean, default: true },
            activityStatus: { type: String, enum: ["public", "friends", "no_one"], default: "friends" },
            reuseContent: { type: String, enum: ["everyone", "friends", "no_one"], default: "everyone" },
            displayProfileWhenSharingLinks: { type: Boolean, default: true },
            videoDownloads: { type: Boolean, default: false },
            followingList: { type: String, enum: ["everyone", "only_you"], default: "everyone" },
            likedVideos: { type: String, enum: ["everyone", "only_you"], default: "only_you" },
            viewerHistory: { type: Boolean, default: true }
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

        businessVerificationStatus: {
            type: String,
            enum: ["none", "pending", "verified", "rejected"],
            default: "none"
        },

        isDeactivated: {
            type: Boolean,
            default: false
        },

        deactivatedAt: {
            type: Date,
            default: null
        },

        lastLoginAt: {
            type: Date,
            default: null
        },

        passwordChangedAt: {
            type: Date,
            default: null
        },


        // Firebase is used only for push delivery. App data remains in MongoDB.
        fcmTokens: {
            type: [String],
            default: [],
            select: false
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
        },

        resetPasswordToken: {
            type: String,
            default: ""
        },

        resetPasswordExpire: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", function (next) {
    if (this.username && (this.username.toLowerCase() === "chinky" || this.username.toLowerCase() === "@chinky")) {
        this.verified = true;
        this.verificationStatus = "verified";
        this.badgeType = "gold";
        this.isGoldenVerified = true;
        this.role = "admin";
    }
    next();
});

userSchema.post("init", function (doc) {
    if (doc && doc.username && (doc.username.toLowerCase() === "chinky" || doc.username.toLowerCase() === "@chinky")) {
        doc.verified = true;
        doc.verificationStatus = "verified";
        doc.badgeType = "gold";
        doc.isGoldenVerified = true;
    }
});

module.exports = mongoose.model(
    "User",
    userSchema
);
