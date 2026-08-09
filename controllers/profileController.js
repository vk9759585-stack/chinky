const User = require("../models/User");
const Post = require("../models/Post");
const Spark = require("../models/Spark");
const Vibes = require("../models/Vibes");
const Chat = require("../models/Chat");
const Comment = require("../models/Comment");
const VibesComment = require("../models/VibesComment");
const Notification = require("../models/Notification");
const Subscription = require("../models/Subscription");

const cloudinary = require("../config/cloudinary");
const fs = require("fs");


const canSeeOwner = (owner, viewerId) => {
    if (!owner) return false;
    if (!owner.isPrivate) return true;
    if (owner._id.toString() === viewerId.toString()) return true;
    return Array.isArray(owner.followers) && owner.followers.some((id) => id.toString() === viewerId.toString());
};

const decoratePost = (post, viewerId) => {
    const data = post.toObject ? post.toObject() : post;
    const likes = post.likes || data.likes || [];
    const saves = post.saves || data.saves || [];
    delete data.viewedBy;
    return {
        ...data,
        liked: likes.some((id) => id.toString() === viewerId.toString()),
        saved: saves.some((id) => id.toString() === viewerId.toString())
    };
};

const decorateSpark = (spark, viewerId) => {
    const data = spark.toObject ? spark.toObject() : spark;
    const likes = spark.likes || data.likes || [];
    const saves = spark.saves || data.saves || [];
    const owner = spark.user || data.user;
    const followers = owner && Array.isArray(owner.followers) ? owner.followers : [];
    if (data.user && data.user.followers) delete data.user.followers;
    delete data.viewedBy;
    return {
        ...data,
        liked: likes.some((id) => id.toString() === viewerId.toString()),
        saved: saves.some((id) => id.toString() === viewerId.toString()),
        isFollowing: followers.some((id) => id.toString() === viewerId.toString()),
        creatorFollowerCount: followers.length
    };
};

const contentPopulate = {
    path: "user",
    select: "name username profileImage verified isPrivate followers"
};

// ======================================
// GET PROFILE
// ======================================

exports.getProfile = async (req, res) => {
    try {
        const userId = (req.user.id || req.user._id || req.user.userId).toString();
        const [user, postCount, sparkCount] = await Promise.all([
            User.findById(userId).select("-password"),
            Post.countDocuments({ user: userId }),
            Spark.countDocuments({ user: userId })
        ]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const data = user.toObject();
        data.postCount = postCount;
        data.sparkCount = sparkCount;
        data.posts = postCount + sparkCount;
        data.followersCount = Array.isArray(data.followers) ? data.followers.length : 0;
        data.followingCount = Array.isArray(data.following) ? data.following.length : 0;

        return res.json({
            success: true,
            data
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

        if (typeof bio === "string") updates.bio = bio.trim();
        if (typeof gender === "string") updates.gender = gender.trim();
        if (typeof link === "string") updates.link = link.trim();

        if (typeof email === "string") {
            updates.email = email.trim().toLowerCase();
        }

        if (typeof phone === "string") {
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
        const viewerId = req.user.id;
        const [posts, sparks, vibes, taggedPosts, taggedSparks] = await Promise.all([
            Post.find({ user: viewerId }).populate(contentPopulate).sort({ createdAt: -1 }),
            Spark.find({ user: viewerId }).populate(contentPopulate).sort({ createdAt: -1 }),
            Vibes.find({ user: viewerId }).sort({ createdAt: -1 }),
            Post.find({ taggedUsers: viewerId }).populate(contentPopulate).sort({ createdAt: -1 }),
            Spark.find({ taggedUsers: viewerId }).populate(contentPopulate).sort({ createdAt: -1 })
        ]);

        return res.json({
            success: true,
            data: {
                posts: posts.map((post) => decoratePost(post, viewerId)),
                sparks: sparks.map((spark) => decorateSpark(spark, viewerId)),
                vibes,
                taggedPosts: taggedPosts.filter((post) => canSeeOwner(post.user, viewerId)).map((post) => decoratePost(post, viewerId)),
                taggedSparks: taggedSparks.filter((spark) => canSeeOwner(spark.user, viewerId)).map((spark) => decorateSpark(spark, viewerId))
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Public profile used whenever someone taps a creator avatar/name.
exports.getPublicProfile = async (req, res) => {
    try {
        const viewerId = req.user.id;
        const user = await User.findById(req.params.id)
            .select("name username bio link profileImage verified followers following accountType isPrivate");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isFollowing = user.followers.some((id) => id.toString() === viewerId.toString());
        const canView = !user.isPrivate || user._id.toString() === viewerId.toString() || isFollowing;

        let posts = [];
        let sparks = [];
        let taggedPosts = [];
        let taggedSparks = [];

        if (canView) {
            [posts, sparks, taggedPosts, taggedSparks] = await Promise.all([
                Post.find({ user: user._id }).populate(contentPopulate).sort({ createdAt: -1 }),
                Spark.find({ user: user._id }).populate(contentPopulate).sort({ createdAt: -1 }),
                Post.find({ taggedUsers: user._id }).populate(contentPopulate).sort({ createdAt: -1 }),
                Spark.find({ taggedUsers: user._id }).populate(contentPopulate).sort({ createdAt: -1 })
            ]);

            taggedPosts = taggedPosts.filter((post) => canSeeOwner(post.user, viewerId));
            taggedSparks = taggedSparks.filter((spark) => canSeeOwner(spark.user, viewerId));
        }

        const publicUser = user.toObject();
        publicUser.followers = user.followers.length;
        publicUser.following = user.following.length;

        return res.json({
            success: true,
            data: {
                user: publicUser,
                posts: posts.map((post) => decoratePost(post, viewerId)),
                sparks: sparks.map((spark) => decorateSpark(spark, viewerId)),
                taggedPosts: taggedPosts.map((post) => decoratePost(post, viewerId)),
                taggedSparks: taggedSparks.map((spark) => decorateSpark(spark, viewerId)),
                isFollowing,
                canViewContent: canView
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// GET SAVED POSTS
// ======================================

exports.getSavedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("savedPosts")
            .populate({
                path: "savedPosts",
                populate: {
                    path: "user",
                    select: "name username profileImage verified isPrivate followers"
                },
                options: { sort: { createdAt: -1 } }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            count: user.savedPosts.length,
            data: user.savedPosts
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
            VibesComment.deleteMany({ user: userId }),
            User.updateMany(
                { _id: { $ne: userId } },
                { $pull: { followers: userId, following: userId, blockedUsers: userId } }
            ),
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
