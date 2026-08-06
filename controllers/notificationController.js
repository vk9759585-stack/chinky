const Notification = require("../models/Notification");

// =====================================
// CREATE NOTIFICATION
// =====================================

exports.createNotification = async (req, res) => {
    try {
        const notification = await Notification.create({
            sender: req.user.id,
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
            receiver: req.user.id
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

        const notification =
            await Notification.findByIdAndUpdate(
                req.params.id,
                {
                    isRead: true
                },
                {
                    new: true
                }
            );

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