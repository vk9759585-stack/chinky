const mongoose = require('mongoose');

const dailyCheckInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  streak: {
    type: Number,
    default: 0,
    min: 0,
    max: 7,
  },
  lastClaimDay: {
    type: String,
    default: '',
  },
  lastClaimAt: {
    type: Date,
    default: null,
  },
  completedCycles: {
    type: Number,
    default: 0,
    min: 0,
  },
  adRewardDay: {
    type: String,
    default: '',
    index: true,
  },
  adsWatchedToday: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  adCoinsToday: {
    type: Number,
    default: 0,
    min: 0,
    max: 15,
  },
}, { timestamps: true });

module.exports = mongoose.model('DailyCheckIn', dailyCheckInSchema);
