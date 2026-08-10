const mongoose = require("mongoose");

const waitlistEntrySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    source: {
      type: String,
      default: "website",
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WaitlistEntry", waitlistEntrySchema);
