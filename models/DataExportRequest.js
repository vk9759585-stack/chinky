const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  format: { type: String, enum: ['txt', 'json'], default: 'txt' },
  categories: { type: [String], default: [] },
  status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing', index: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  readyAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('DataExportRequest', schema);
