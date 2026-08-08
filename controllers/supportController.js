const Feedback = require("../models/Feedback");

exports.submitFeedback = async (req, res) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ success: false, message: "Feedback is required" });
    const userId = req.user.id || req.user._id || req.user.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const feedback = await Feedback.create({ user: userId, message });
    return res.status(201).json({ success: true, data: { id: feedback._id, status: feedback.status } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
