const User = require("../models/User");
const Post = require("../models/Post");
const Spark = require("../models/Spark");
const Vibes = require("../models/Vibes");
const Chat = require("../models/Chat");
const Comment = require("../models/Comment");
const VibesComment = require("../models/VibesComment");
const Notification = require("../models/Notification");
const Subscription = require("../models/Subscription");
const DataExportRequest = require("../models/DataExportRequest");
const Wallet = require("../models/Wallet");
const WalletLedger = require("../models/WalletLedger");
const Payment = require("../models/Payment");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const UpiCoinRequest = require("../models/UpiCoinRequest");
const SparkComment = require("../models/SparkComment");
const LiveSession = require("../models/LiveSession");
const ShopOrder = require("../models/ShopOrder");
const Audio = require("../models/Audio");
const Call = require("../models/Call");
const Conversation = require("../models/Conversation");
const CreatorToolsProfile = require("../models/CreatorToolsProfile");
const DailyCheckIn = require("../models/DailyCheckIn");
const FamilyPairing = require("../models/FamilyPairing");
const Feedback = require("../models/Feedback");
const Follow = require("../models/Follow");
const Gift = require("../models/Gift");
const GroupChat = require("../models/GroupChat");
const GroupMessage = require("../models/GroupMessage");
const LiveBattle = require("../models/LiveBattle");
const LoginHistory = require("../models/LoginHistory");
const Message = require("../models/Message");
const Otp = require("../models/Otp");
const Referral = require("../models/Referral");
const Report = require("../models/Report");
const Revenue = require("../models/Revenue");
const ScheduledLive = require("../models/ScheduledLive");
const SocialFeature = require("../models/SocialFeature");
const StorePurchase = require("../models/StorePurchase");
const SupportTicket = require("../models/SupportTicket");
const VibesSeen = require("../models/VibesSeen");

const cloudinary = require("../config/cloudinary");
const fs = require("fs");


const canSeeOwner = (owner, viewerId) => {
    if (!owner || owner.isDeactivated) return false;
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
    select: "name username profileImage verified isPrivate isDeactivated followers"
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
            const normalizedEmail = email.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return res.status(400).json({ success: false, message: "Enter a valid email address" });
            }
            const emailOwner = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: req.user.id }
            }).select("_id").lean();
            if (emailOwner) {
                return res.status(409).json({ success: false, message: "Email is already in use" });
            }
            updates.email = normalizedEmail;
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
            Post.find({
                user: viewerId,
                $or: [
                    { moderationStatus: { $exists: false } },
                    { moderationStatus: "approved" },
                    { moderationStatus: "pending" }
                ]
            }).populate(contentPopulate).sort({ createdAt: -1 }),
            Spark.find({
                user: viewerId,
                $and: [
                    {
                        $or: [
                            { publishStatus: { $exists: false } },
                            { publishStatus: "ready" }
                        ]
                    },
                    {
                        $or: [
                            { moderationStatus: { $exists: false } },
                            { moderationStatus: "approved" },
                            { moderationStatus: "pending" }
                        ]
                    }
                ]
            }).populate(contentPopulate).sort({ createdAt: -1 }),
            Vibes.find({ user: viewerId }).sort({ createdAt: -1 }),
            Post.find({
                taggedUsers: viewerId,
                $or: [
                    { moderationStatus: { $exists: false } },
                    { moderationStatus: "approved" }
                ]
            }).populate(contentPopulate).sort({ createdAt: -1 }),
            Spark.find({
                taggedUsers: viewerId,
                $and: [
                    {
                        $or: [
                            { publishStatus: { $exists: false } },
                            { publishStatus: "ready" }
                        ]
                    },
                    {
                        $or: [
                            { moderationStatus: { $exists: false } },
                            { moderationStatus: "approved" }
                        ]
                    }
                ]
            }).populate(contentPopulate).sort({ createdAt: -1 })
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
            .select("name username bio link profileImage verified followers following accountType isPrivate isDeactivated");

        if (!user || user.isDeactivated) return res.status(404).json({ success: false, message: "User not found" });

        const isFollowing = user.followers.some((id) => id.toString() === viewerId.toString());
        const canView = !user.isPrivate || user._id.toString() === viewerId.toString() || isFollowing;

        let posts = [];
        let sparks = [];
        let taggedPosts = [];
        let taggedSparks = [];

        if (canView) {
            const ownProfile = user._id.toString() === viewerId.toString();
            const moderationVisibility = ownProfile
                ? {
                    $or: [
                        { moderationStatus: { $exists: false } },
                        { moderationStatus: "approved" },
                        { moderationStatus: "pending" }
                    ]
                }
                : {
                    $or: [
                        { moderationStatus: { $exists: false } },
                        { moderationStatus: "approved" }
                    ]
                };

            const approvedOnly = {
                $or: [
                    { moderationStatus: { $exists: false } },
                    { moderationStatus: "approved" }
                ]
            };
            const sparkReady = {
                $or: [
                    { publishStatus: { $exists: false } },
                    { publishStatus: "ready" }
                ]
            };

            [posts, sparks, taggedPosts, taggedSparks] = await Promise.all([
                Post.find({ user: user._id, ...moderationVisibility })
                    .populate(contentPopulate)
                    .sort({ createdAt: -1 }),
                Spark.find({
                    user: user._id,
                    $and: [sparkReady, moderationVisibility]
                }).populate(contentPopulate).sort({ createdAt: -1 }),
                Post.find({ taggedUsers: user._id, ...approvedOnly })
                    .populate(contentPopulate)
                    .sort({ createdAt: -1 }),
                Spark.find({
                    taggedUsers: user._id,
                    $and: [sparkReady, approvedOnly]
                }).populate(contentPopulate).sort({ createdAt: -1 })
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
                    select: "name username profileImage verified isPrivate isDeactivated followers"
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

        if (user.verified || user.verificationStatus === "verified") {
            return res.status(409).json({ success: false, message: "Account is already verified" });
        }
        if (user.verificationStatus === "pending") {
            return res.json({ success: true, message: "Verification request is already pending" });
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

        const [postIds, sparkIds, vibeIds, ownedGroupIds] = await Promise.all([
            Post.find({ user: userId }).distinct("_id"),
            Spark.find({ user: userId }).distinct("_id"),
            Vibes.find({ user: userId }).distinct("_id"),
            GroupChat.find({ owner: userId }).distinct("_id")
        ]);

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
            Comment.deleteMany({ $or: [{ user: userId }, { post: { $in: postIds } }] }),
            SparkComment.deleteMany({ $or: [{ user: userId }, { reel: { $in: sparkIds } }] }),
            VibesComment.deleteMany({ $or: [{ user: userId }, { vibe: { $in: vibeIds } }] }),
            Post.updateMany({}, { $pull: { likes: userId, saves: userId, taggedUsers: userId } }),
            Spark.updateMany({}, { $pull: { likes: userId, saves: userId, taggedUsers: userId } }),
            Vibes.updateMany({}, { $pull: { likes: userId, viewers: userId, taggedUsers: userId } }),
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
            Subscription.deleteMany({ user: userId }),
            DataExportRequest.deleteMany({ user: userId }),
            Wallet.deleteMany({ user: userId }),
            WalletLedger.deleteMany({ user: userId }),
            Payment.deleteMany({ user: userId }),
            WithdrawalRequest.deleteMany({ user: userId }),
            UpiCoinRequest.deleteMany({ user: userId }),
            ShopOrder.deleteMany({ user: userId }),
            StorePurchase.deleteMany({ user: userId }),
            Call.deleteMany({ $or: [{ caller: userId }, { receiver: userId }] }),
            Conversation.deleteMany({ members: userId }),
            Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
            Gift.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            FamilyPairing.deleteMany({ $or: [{ parent: userId }, { teen: userId }] }),
            LiveSession.deleteMany({ $or: [{ hostUserId: userId }, { guestUserId: userId }] }),
            LiveBattle.deleteMany({ $or: [{ host: userId }, { opponent: userId }] }),
            ScheduledLive.deleteMany({ host: userId }),
            LoginHistory.deleteMany({ user: userId }),
            Otp.deleteMany({ user: userId }),
            Referral.deleteMany({ $or: [{ referrer: userId }, { referredUser: userId }] }),
            Report.deleteMany({ $or: [{ reporter: userId }, { targetUser: userId }] }),
            Revenue.deleteMany({ user: userId }),
            SocialFeature.deleteMany({ $or: [{ owner: userId }, { targetUser: userId }] }),
            SupportTicket.deleteMany({ user: userId }),
            Feedback.deleteMany({ user: userId }),
            DailyCheckIn.deleteMany({ user: userId }),
            CreatorToolsProfile.deleteMany({ user: userId }),
            VibesSeen.deleteMany({ user: userId }),
            GroupMessage.deleteMany({ $or: [{ sender: userId }, { group: { $in: ownedGroupIds } }] }),
            GroupChat.deleteMany({ _id: { $in: ownedGroupIds } }),
            GroupChat.updateMany({}, { $pull: { members: userId, admins: userId } }),
            Audio.updateMany({}, { $pull: { savedBy: userId } }),
            Audio.updateMany({ owner: userId }, { $set: { owner: null } })
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

// ======================================
// PRIVACY SETTINGS
// ======================================
const PRIVACY_ENUMS = {
    comments: ["everyone", "friends", "no_one"],
    mentions: ["everyone", "friends", "no_one"],
    directMessages: ["everyone", "friends", "no_one"],
    activityStatus: ["public", "friends", "no_one"],
    reuseContent: ["everyone", "friends", "no_one"],
    followingList: ["everyone", "only_you"],
    likedVideos: ["everyone", "only_you"]
};
const PRIVACY_BOOLEANS = [
    "creatorCareMode", "filterUnwantedComments", "readStatus",
    "displayProfileWhenSharingLinks", "videoDownloads", "viewerHistory"
];


// ======================================
// APP SETTINGS (cross-device preferences)
// ======================================
const SAFE_SETTING_KEY = /^[a-zA-Z0-9_]{1,80}$/;

exports.getAppSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("appSettings").lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, data: user.appSettings || {} });
    } catch (_) {
        return res.status(500).json({ success: false, message: "Could not load settings" });
    }
};

exports.updateAppSettings = async (req, res) => {
    try {
        const changes = req.body?.changes;
        if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
            return res.status(400).json({ success: false, message: "changes must be an object" });
        }
        const entries = Object.entries(changes);
        if (entries.length > 50) return res.status(400).json({ success: false, message: "Too many settings" });
        const set = {};
        const unset = {};
        for (const [key, value] of entries) {
            if (!SAFE_SETTING_KEY.test(key)) return res.status(400).json({ success: false, message: `Invalid setting key: ${key}` });
            const valid = value === null || ["boolean","string","number"].includes(typeof value) || (Array.isArray(value) && value.length <= 100);
            if (!valid) return res.status(400).json({ success: false, message: `Invalid value for ${key}` });
            if (value === null) unset[`appSettings.${key}`] = 1;
            else set[`appSettings.${key}`] = value;
        }
        const update = {};
        if (Object.keys(set).length) update.$set = set;
        if (Object.keys(unset).length) update.$unset = unset;
        const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true }).select("appSettings").lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, data: user.appSettings || {} });
    } catch (_) {
        return res.status(500).json({ success: false, message: "Could not save settings" });
    }
};

exports.getPrivacySettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("isPrivate privacySettings");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, data: { isPrivate: user.isPrivate, ...(user.privacySettings?.toObject?.() || user.privacySettings || {}) } });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Could not load privacy settings" });
    }
};

exports.updatePrivacySettings = async (req, res) => {
    try {
        const set = {};
        if (typeof req.body.isPrivate === "boolean") set.isPrivate = req.body.isPrivate;
        for (const [key, allowed] of Object.entries(PRIVACY_ENUMS)) {
            if (req.body[key] !== undefined) {
                if (!allowed.includes(req.body[key])) return res.status(400).json({ success: false, message: `Invalid ${key}` });
                set[`privacySettings.${key}`] = req.body[key];
            }
        }
        for (const key of PRIVACY_BOOLEANS) {
            if (req.body[key] !== undefined) {
                if (typeof req.body[key] !== "boolean") return res.status(400).json({ success: false, message: `Invalid ${key}` });
                set[`privacySettings.${key}`] = req.body[key];
            }
        }
        if (req.body.commentKeywords !== undefined) {
            if (!Array.isArray(req.body.commentKeywords)) return res.status(400).json({ success: false, message: "commentKeywords must be an array" });
            const words = [...new Set(req.body.commentKeywords.map(v => String(v).trim().toLowerCase()).filter(Boolean))].slice(0, 100);
            if (words.some(v => v.length > 50)) return res.status(400).json({ success: false, message: "Keyword too long" });
            set["privacySettings.commentKeywords"] = words;
        }
        const user = await User.findByIdAndUpdate(req.user.id, { $set: set }, { new: true, runValidators: true }).select("isPrivate privacySettings");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, data: { isPrivate: user.isPrivate, ...(user.privacySettings?.toObject?.() || user.privacySettings || {}) } });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Could not save privacy settings" });
    }
};


// ======================================
// BUSINESS VERIFICATION
// ======================================
exports.requestBusinessVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.businessVerificationStatus === "verified") {
            return res.status(409).json({ success: false, message: "Business is already verified" });
        }
        if (user.businessVerificationStatus === "pending") {
            return res.json({ success: true, message: "Business verification request is already pending" });
        }
        user.accountType = "professional";
        user.businessVerificationStatus = "pending";
        await user.save();
        return res.json({ success: true, message: "Business verification request submitted" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// DEACTIVATE ACCOUNT
// ======================================
exports.deactivateAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { isDeactivated: true, deactivatedAt: new Date() },
            { new: true }
        ).select("_id isDeactivated deactivatedAt");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, message: "Account deactivated" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const EXPORT_CATEGORIES = new Set([
    "Comments", "Direct Messages", "Income + Wallet", "Likes and Favourites",
    "Posts", "Profile and Settings", "Chinky LIVE", "Chinky Shop", "Your Activity"
]);

const scrub = (value) => JSON.parse(JSON.stringify(value));

async function buildExportPayload(userId, categories) {
    const payload = { generatedAt: new Date().toISOString(), categories: {} };
    const wants = new Set(categories);

    if (wants.has("Profile and Settings")) {
        const user = await User.findById(userId)
            .select("-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire")
            .lean();
        payload.categories["Profile and Settings"] = scrub(user || {});
    }

    if (wants.has("Posts")) {
        const [posts, sparks, vibes] = await Promise.all([
            Post.find({ user: userId }).lean(),
            Spark.find({ user: userId }).lean(),
            Vibes.find({ user: userId }).lean(),
        ]);
        payload.categories.Posts = { posts: scrub(posts), sparks: scrub(sparks), vibes: scrub(vibes) };
    }

    if (wants.has("Comments")) {
        const [postComments, sparkComments, vibesComments] = await Promise.all([
            Comment.find({ user: userId }).lean(),
            SparkComment.find({ user: userId }).lean(),
            VibesComment.find({ user: userId }).lean(),
        ]);
        payload.categories.Comments = { postComments: scrub(postComments), sparkComments: scrub(sparkComments), vibesComments: scrub(vibesComments) };
    }

    if (wants.has("Direct Messages")) {
        const messages = await Chat.find({ $or: [{ sender: userId }, { receiver: userId }] }).lean();
        payload.categories["Direct Messages"] = scrub(messages);
    }

    if (wants.has("Income + Wallet")) {
        const [wallet, ledger, payments, withdrawals, upiRequests] = await Promise.all([
            Wallet.findOne({ user: userId }).lean(),
            WalletLedger.find({ user: userId }).sort({ createdAt: -1 }).lean(),
            Payment.find({ user: userId }).sort({ createdAt: -1 }).lean(),
            WithdrawalRequest.find({ user: userId }).sort({ createdAt: -1 }).lean(),
            UpiCoinRequest.find({ user: userId }).sort({ createdAt: -1 }).lean(),
        ]);
        payload.categories["Income + Wallet"] = scrub({ wallet, ledger, payments, withdrawals, upiRequests });
    }

    if (wants.has("Likes and Favourites")) {
        const [posts, sparks, user] = await Promise.all([
            Post.find({ likes: userId }).select("_id createdAt").lean(),
            Spark.find({ likes: userId }).select("_id createdAt").lean(),
            User.findById(userId).select("savedPosts").lean(),
        ]);
        payload.categories["Likes and Favourites"] = scrub({ likedPosts: posts, likedSparks: sparks, savedPosts: user?.savedPosts || [] });
    }

    if (wants.has("Chinky LIVE")) {
        const lives = await LiveSession.find({ hostUserId: userId }).sort({ startedAt: -1 }).lean();
        payload.categories["Chinky LIVE"] = scrub(lives);
    }

    if (wants.has("Chinky Shop")) {
        const orders = await ShopOrder.find({ user: userId }).sort({ createdAt: -1 }).lean();
        payload.categories["Chinky Shop"] = scrub(orders);
    }

    if (wants.has("Your Activity")) {
        const notifications = await Notification.find({ $or: [{ sender: userId }, { receiver: userId }] }).sort({ createdAt: -1 }).limit(1000).lean();
        payload.categories["Your Activity"] = scrub({ notifications });
    }

    return payload;
}

exports.createDataExportRequest = async (req, res) => {
    try {
        const format = req.body.format === "json" ? "json" : "txt";
        const categories = Array.isArray(req.body.categories)
            ? [...new Set(req.body.categories.map(String).filter(v => EXPORT_CATEGORIES.has(v)))]
            : [];
        if (!categories.length) return res.status(400).json({ success: false, message: "Select at least one data category" });

        const record = await DataExportRequest.create({ user: req.user.id, format, categories, status: "processing" });
        try {
            record.payload = await buildExportPayload(req.user.id, categories);
            record.status = "ready";
            record.readyAt = new Date();
            record.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await record.save();
        } catch (err) {
            record.status = "failed";
            await record.save();
            throw err;
        }
        return res.status(201).json({ success: true, data: record });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listDataExportRequests = async (req, res) => {
    try {
        const rows = await DataExportRequest.find({ user: req.user.id })
            .select("format categories status readyAt expiresAt createdAt")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.downloadDataExport = async (req, res) => {
    try {
        const row = await DataExportRequest.findOne({ _id: req.params.id, user: req.user.id }).lean();
        if (!row) return res.status(404).json({ success: false, message: "Export request not found" });
        if (row.status !== "ready") return res.status(409).json({ success: false, message: "Export is not ready" });
        if (row.expiresAt && new Date(row.expiresAt) < new Date()) return res.status(410).json({ success: false, message: "Export expired" });

        if (row.format === "json") {
            res.type("application/json");
            return res.send(JSON.stringify(row.payload, null, 2));
        }
        const lines = ["Chinky Data Export", `Generated: ${row.payload?.generatedAt || row.readyAt}`, ""];
        for (const [name, value] of Object.entries(row.payload?.categories || {})) {
            lines.push(`===== ${name} =====`, JSON.stringify(value, null, 2), "");
        }
        res.type("text/plain");
        return res.send(lines.join("\n"));
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
