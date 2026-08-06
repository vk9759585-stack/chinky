const User = require("../models/User");
const Post = require("../models/Post");
const Spark = require("../models/Spark");
const Vibes = require("../models/Vibes");
const Chat = require("../models/Chat");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Subscription = require("../models/Subscription");

const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ======================================
// GET PROFILE
// ======================================

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            data: user
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// UPDATE PROFILE
// ======================================

exports.updateProfile = async (req, res) => {
    try {
        const {
            name,
            username,
            bio,
            gender,
            link,
            email,
            phone,
            isPrivate,
            accountType
        } = req.body;

        const updates = {};

        if (name) updates.name = name.trim();

        if (username) {
            updates.username = username
                .trim()
                .toLowerCase();
        }

        if (bio) updates.bio = bio.trim();
        if (gender) updates.gender = gender.trim();
        if (link) updates.link = link.trim();

        if (email) {
            updates.email = email.trim().toLowerCase();
        }

        if (phone) {
            updates.phone = phone.trim();
        }

        if (typeof isPrivate === "boolean") {
            updates.isPrivate = isPrivate;
        }

        if (["personal", "professional"].includes(accountType)) {
            updates.accountType = accountType;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        return res.json({
            success: true,
            data: user
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// GET MY CONTENT
// ======================================

exports.getMyContent = async (req, res) => {
    try {
        const [posts, sparks, vibes] = await Promise.all([
            Post.find({ user: req.user.id }).sort({ createdAt: -1 }),
            Spark.find({ user: req.user.id }).sort({ createdAt: -1 }),
            Vibes.find({ user: req.user.id }).sort({ createdAt: -1 })
        ]);

        return res.json({
            success: true,
            data: {
                posts,
                sparks,
                vibes
            }
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// REQUEST VERIFICATION
// ======================================

exports.requestVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.verificationStatus = "pending";

        await user.save();

        return res.json({
            success: true,
            message: "Verification request submitted"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// DELETE ACCOUNT
// ======================================

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        await Promise.all([
            Post.deleteMany({ user: userId }),
            Spark.deleteMany({ user: userId }),
            Vibes.deleteMany({ user: userId }),
            Chat.deleteMany({
                $or: [
                    { sender: userId },
                    { receiver: userId }
                ]
            }),
            Comment.deleteMany({ user: userId }),
            Notification.deleteMany({
                $or: [
                    { sender: userId },
                    { receiver: userId }
                ]
            }),
            Subscription.deleteMany({ user: userId })
        ]);

        await User.findByIdAndDelete(userId);

        return res.json({
            success: true,
            message: "Account deleted successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// UPLOAD PROFILE PHOTO
// ======================================

exports.uploadProfilePhoto = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile photo is required"
            });
        }

        const result = await cloudinary.uploader.upload(
            req.file.path,
            {
                resource_type: "image",
                folder: "chinky/profiles"
            }
        );

        await fs.promises.unlink(req.file.path);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                profileImage: result.secure_url
            },
            {
                new: true
            }
        ).select("-password");

        return res.json({
            success: true,
            data: user
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};