const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["new", "reviewed", "closed"], default: "new", index: true }
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
