const mongoose = require('mongoose');

const storePurchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  platform: { type: String, enum: ['android', 'ios'], required: true },
  productId: { type: String, required: true, trim: true },
  packageId: { type: String, required: true, trim: true },
  coins: { type: Number, required: true, min: 1 },
  transactionId: { type: String, trim: true },
  purchaseToken: { type: String, trim: true },
  status: { type: String, enum: ['verified', 'rejected'], default: 'verified' },
  storePayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  processedAt: { type: Date, default: Date.now },
}, { timestamps: true });

storePurchaseSchema.index(
  { platform: 1, transactionId: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $type: 'string' } } },
);
storePurchaseSchema.index(
  { platform: 1, purchaseToken: 1 },
  { unique: true, partialFilterExpression: { purchaseToken: { $type: 'string' } } },
);

module.exports = mongoose.model('StorePurchase', storePurchaseSchema);
