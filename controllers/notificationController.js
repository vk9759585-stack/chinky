const User = require("../models/User");
const Notification = require("../models/Notification");

// =====================================
// CREATE NOTIFICATION
// =====================================

exports.createNotification = async (req, res) => {
    try {
        const senderId = req.user.id || req.user._id || req.user.userId;
        const notification = await Notification.create({
            sender: senderId,
            receiver: req.body.receiver,
            type: req.body.type,
            title: req.body.title,
            body: req.body.body,
            image: req.body.image || "",
            isRead: false
        });

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// GET NOTIFICATIONS
// =====================================

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
        const before = req.query.before ? new Date(req.query.before) : null;
        const filter = {
            receiver: userId,
            ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { $lt: before } } : {})
        };

        const notifications = await Notification.find(filter)
            .populate("sender", "username profileImage verified")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json({
            success: true,
            count: notifications.length,
            data: notifications,
            nextCursor: notifications.length ? notifications[notifications.length - 1].createdAt : null
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// MARK AS READ
// =====================================

exports.markRead = async (req, res) => {
    try {

        const userId = (req.user.id || req.user._id || req.user.userId).toString();
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, receiver: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });

        return res.json({
            success: true,
            data: notification
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// DELETE NOTIFICATION
// =====================================

exports.deleteNotification = async (req, res) => {
    try {

        const userId = (req.user.id || req.user._id || req.user.userId).toString();
        const deleted = await Notification.findOneAndDelete({ _id: req.params.id, receiver: userId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        return res.json({
            success: true,
            message: "Notification deleted"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    await Notification.updateMany({ receiver: userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const count = await Notification.countDocuments({ receiver: userId, isRead: false });
    return res.json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// =====================================
// REGISTER / REMOVE PUSH DEVICE TOKEN
// =====================================

exports.registerDeviceToken = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const token = String(req.body.token || "").trim();
    if (token.length < 20 || token.length > 4096) {
      return res.status(400).json({ success: false, message: "Invalid device token" });
    }

    const user = await User.findById(userId).select("+fcmTokens");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const existing = Array.isArray(user.fcmTokens) ? user.fcmTokens : [];
    user.fcmTokens = [token, ...existing.filter((item) => item !== token)].slice(0, 10);
    await user.save();

    return res.json({ success: true, message: "Push device registered" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeDeviceToken = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const token = String(req.body.token || "").trim();
    if (!token) return res.status(400).json({ success: false, message: "Device token is required" });

    await User.updateOne({ _id: userId }, { $pull: { fcmTokens: token } });
    return res.json({ success: true, message: "Push device removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
