const Story = require("../models/Story");

exports.getStories = async (req, res) => {
    try {
        const stories = await Story.find({ expiresAt: { $gt: new Date() } })
            .populate("user", "name username profileImage verified")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: stories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.uploadStory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Story media is required" });
        }
        const story = await Story.create({
            user: req.user.id,
            media: req.file.filename,
            isVideo: req.file.mimetype.startsWith("video/")
        });
        res.status(201).json(story);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
