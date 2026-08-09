const SupportTicket = require("../models/SupportTicket");
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


exports.createTicket = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();
    const category = String(req.body.category || "technical");
    if (!subject || !message) return res.status(400).json({ success: false, message: "Subject and message are required" });
    const allowed = ["account", "payments", "audio", "copyright", "safety", "technical", "other"];
    const ticket = await SupportTicket.create({ user: userId, subject, message, category: allowed.includes(category) ? category : "other" });
    return res.status(201).json({ success: true, data: ticket });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

exports.myTickets = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const data = await SupportTicket.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

exports.help = async (_req, res) => res.json({ success: true, data: [
  { id: "notifications", title: "Notifications", body: "Activity updates appear when someone follows, likes or comments. Pull to refresh if your connection was offline." },
  { id: "audio", title: "Audio & copyright", body: "You can save and reuse audio marked reusable. Only upload audio you have rights to use." },
  { id: "payments", title: "Coins & payments", body: "Coin purchases are credited only after payment/store verification." },
  { id: "account", title: "Account & security", body: "Use Password & Security to manage active sessions and account controls." }
] });
