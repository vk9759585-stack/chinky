const mongoose = require("mongoose");

const revenueSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    source: {
      type: String,
      enum: [
        "ads",
        "subscription",
        "gift"
      ]
    },

    amount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Revenue",
  revenueSchema
);