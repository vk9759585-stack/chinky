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
        const notifications = await Notification.find({
            receiver: req.user.id || req.user._id || req.user.userId
        })
            .populate(
                "sender",
                "username profileImage verified"
            )
            .sort({
                createdAt: -1
            });

        return res.json({
            success: true,
            count: notifications.length,
            data: notifications
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

        await Notification.findByIdAndDelete(
            req.params.id
        );

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
