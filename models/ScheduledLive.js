const mongoose = require("mongoose");

const scheduledLiveSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  scheduledFor: { type: Date, required: true, index: true },
  reminderSent: { type: Boolean, default: false },
  status: { type: String, enum: ["scheduled", "started", "cancelled", "ended"], default: "scheduled" }
}, { timestamps: true });
scheduledLiveSchema.index({ host: 1, scheduledFor: 1 });
module.exports = mongoose.model("ScheduledLive", scheduledLiveSchema);
