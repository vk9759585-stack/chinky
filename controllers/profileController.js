const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

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
        const { name, username, bio, gender, link } = req.body;
        const updates = {};

        if (typeof name === "string") updates.name = name.trim();
        if (typeof username === "string") updates.username = username.trim().toLowerCase();
        if (typeof bio === "string") updates.bio = bio.trim();
        if (typeof gender === "string") updates.gender = gender.trim();
        if (typeof link === "string") updates.link = link.trim();

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

exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Profile photo is required" });
        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "image",
            folder: "chinky/profiles",
        });
        await fs.promises.unlink(req.file.path).catch(() => {});
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImage: result.secure_url },
            { new: true }
        ).select("-password");
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
