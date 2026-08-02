const User = require("../models/User");

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, username, bio } = req.body;
        const updates = {};

        if (typeof name === "string") updates.name = name.trim();
        if (typeof username === "string") updates.username = username.trim().toLowerCase();
        if (typeof bio === "string") updates.bio = bio.trim();

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

        res.json({ success: true, data: user });
    } catch (err) {
        const status = err.code === 11000 ? 400 : 500;
        res.status(status).json({
            success: false,
            message: err.code === 11000 ? "Username is already taken" : err.message
        });
    }
};
