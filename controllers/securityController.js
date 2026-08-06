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