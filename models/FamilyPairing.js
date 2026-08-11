const mongoose = require('mongoose');

const familyPairingSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'revoked'],
      default: 'pending',
      index: true,
    },
    inviteCode: {
      type: String,
      default: '',
      uppercase: true,
      trim: true,
      index: true,
    },
    controls: {
      saferContentMode: { type: Boolean, default: true },
      allowDirectMessages: { type: Boolean, default: true },
      privateAccount: { type: Boolean, default: true },
      dailyScreenTimeMinutes: { type: Number, default: 120, min: 15, max: 1440 },
    },
    pairedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

familyPairingSchema.index(
  { teen: 1, status: 1 },
  { unique: true, partialFilterExpression: { teen: { $type: 'objectId' }, status: 'active' } },
);

module.exports = mongoose.model('FamilyPairing', familyPairingSchema);
