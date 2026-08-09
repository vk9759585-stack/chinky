const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, enum: ["account", "payments", "audio", "copyright", "safety", "technical", "other"], default: "technical" },
  subject: { type: String, trim: true, maxlength: 160, required: true },
  message: { type: String, trim: true, maxlength: 5000, required: true },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true }
}, { timestamps: true });
schema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model("SupportTicket", schema);
