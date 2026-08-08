const mongoose = require('mongoose');

const walletLedgerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  transactionType: { type: String, required: true, index: true },
  coinDelta: { type: Number, default: 0 },
  earningDeltaPaise: { type: Number, default: 0 },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  referenceType: { type: String, required: true },
  referenceId: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

walletLedgerSchema.index({ user: 1, createdAt: -1 });
walletLedgerSchema.index({ referenceType: 1, referenceId: 1 });

module.exports = mongoose.model('WalletLedger', walletLedgerSchema);
