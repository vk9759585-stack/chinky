const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "Report",
  reportSchema,
);