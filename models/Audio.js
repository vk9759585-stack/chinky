const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  sourceSpark: { type: mongoose.Schema.Types.ObjectId, ref: "Spark", default: null, index: true },
  title: { type: String, trim: true, maxlength: 120, default: "Original audio" },
  artistName: { type: String, trim: true, maxlength: 120, default: "" },
  streamUrl: { type: String, required: true },
  duration: { type: Number, default: 0 },
  coverUrl: { type: String, default: "" },
  isOriginal: { type: Boolean, default: true },
  isCatalog: { type: Boolean, default: false, index: true },
  catalogKey: { type: String, unique: true, sparse: true },
  category: { type: String, enum: ["original", "music", "shorts", "shayari"], default: "original", index: true },
  mood: { type: String, trim: true, maxlength: 60, default: "" },
  licenseLabel: { type: String, trim: true, maxlength: 160, default: "Creator original" },
  licensePath: { type: String, default: "" },
  reusable: { type: Boolean, default: true, index: true },
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  usageCount: { type: Number, default: 0 },
  blocked: { type: Boolean, default: false, index: true }
}, { timestamps: true });

audioSchema.index({ reusable: 1, blocked: 1, usageCount: -1, createdAt: -1 });
audioSchema.index({ category: 1, reusable: 1, blocked: 1, usageCount: -1 });
audioSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("Audio", audioSchema);
