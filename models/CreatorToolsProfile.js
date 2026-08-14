const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema({
  kind: { type: String, enum: ["post", "spark", "vibes"], default: "spark" },
  caption: { type: String, default: "", maxlength: 500 },
  localPath: { type: String, default: "", maxlength: 1200 },
  sourceId: { type: String, default: "", maxlength: 120 },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  xp: { type: Number, default: 0, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  bannedWords: { type: [String], default: [] },
  mutedWords: { type: [String], default: [] },
  drafts: { type: [draftSchema], default: [] }
}, { timestamps: true });
module.exports = mongoose.model("CreatorToolsProfile", schema);
