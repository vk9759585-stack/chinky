const mongoose = require("mongoose");

const liveBattleSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  liveID: { type: String, default: "", trim: true },
  status: { type: String, enum: ["invited", "active", "ended", "rejected"], default: "invited", index: true },
  hostScore: { type: Number, default: 0, min: 0 },
  opponentScore: { type: Number, default: 0, min: 0 },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null }
}, { timestamps: true });
module.exports = mongoose.model("LiveBattle", liveBattleSchema);
