const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  liveID: { type: String, required: true, unique: true, index: true },
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostName: { type: String, default: 'Chinky creator' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  isLive: { type: Boolean, default: true, index: true },
  guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestStatus: { type: String, enum: ['none', 'invited', 'accepted', 'rejected'], default: 'none' },
}, { timestamps: true });

liveSessionSchema.index({ hostUserId: 1, isLive: 1, startedAt: -1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
