const mongoose = require("mongoose");

const loginSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, default: "", index: true },
    deviceId: { type: String, default: "" },
    deviceName: { type: String, default: "Unknown device" },
    operatingSystem: { type: String, default: "" },
    browser: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    location: { type: String, default: "" },
    loginMethod: { type: String, default: "password" },
    lastActiveAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

loginSessionSchema.index({ user: 1, revokedAt: 1, lastActiveAt: -1 });

module.exports = mongoose.model("LoginSession", loginSessionSchema);
