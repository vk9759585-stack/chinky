const bcrypt = require("bcryptjs");
const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");

// ======================================
// GET LOGIN HISTORY
// ======================================

exports.getLoginHistory = async (req, res) => {
    try {
        const history = await LoginHistory.find({
            user: req.user.id
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// DELETE LOGIN HISTORY
// ======================================

exports.deleteLoginHistory = async (req, res) => {
    try {

        await LoginHistory.deleteMany({
            user: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Login history deleted successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        if (newPassword.length < 8) return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const matched = await bcrypt.compare(currentPassword, user.password);
        if (!matched) return res.status(400).json({ success: false, message: "Current password is incorrect" });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        return res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
