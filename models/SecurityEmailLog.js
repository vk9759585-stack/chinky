const mongoose = require("mongoose");

const securityEmailLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: String, default: "" },
    subject: { type: String, required: true },
    type: { type: String, default: "security" },
    status: { type: String, enum: ["sent", "failed", "recorded"], default: "recorded" }
  },
  { timestamps: true }
);

securityEmailLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("SecurityEmailLog", securityEmailLogSchema);
