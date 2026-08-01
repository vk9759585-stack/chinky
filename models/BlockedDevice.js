const mongoose = require("mongoose");

const blockedDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    deviceId: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "BlockedDevice",
  blockedDeviceSchema,
);