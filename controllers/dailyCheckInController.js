const DailyCheckIn = require('../models/DailyCheckIn');
const { DAILY_CHECKIN_REWARDS } = require('../config/monetization');
const {
  getOrCreateWallet,
  creditRewardCoins,
  runFinancialTransaction,
} = require('../services/walletAccountingService');

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayNumber(key) {
  if (!key) return null;
  const parsed = Date.parse(`${key}T00:00:00.000Z`);
  return Number.isFinite(parsed) ? Math.floor(parsed / DAY_MS) : null;
}

function previousDayKey(now = new Date()) {
  return dayKey(new Date(now.getTime() - DAY_MS));
}

function effectiveState(record, now = new Date()) {
  const today = dayKey(now);
  const yesterday = previousDayKey(now);
  const last = record?.lastClaimDay || '';
  const storedStreak = Math.max(0, Math.min(7, Number(record?.streak || 0)));
  const claimedToday = last === today;

  if (claimedToday) {
    return { claimedToday: true, effectiveStreak: storedStreak, targetDay: storedStreak >= 7 ? 1 : storedStreak + 1 };
  }

  if (last === yesterday && storedStreak > 0 && storedStreak < 7) {
    return { claimedToday: false, effectiveStreak: storedStreak, targetDay: storedStreak + 1 };
  }

  return { claimedToday: false, effectiveStreak: 0, targetDay: 1 };
}

function makeStatus(record, walletCoins, now = new Date()) {
  const state = effectiveState(record, now);
  const days = DAILY_CHECKIN_REWARDS.map((reward, index) => {
    const day = index + 1;
    return {
      day,
      reward,
      claimed: day <= state.effectiveStreak,
      current: !state.claimedToday && day === state.targetDay,
    };
  });

  return {
    streak: state.effectiveStreak,
    claimedToday: state.claimedToday,
    canClaim: !state.claimedToday,
    targetDay: state.targetDay,
    nextReward: DAILY_CHECKIN_REWARDS[state.targetDay - 1],
    walletCoins: Number(walletCoins || 0),
    lastClaimDay: record?.lastClaimDay || null,
    completedCycles: Number(record?.completedCycles || 0),
    days,
  };
}

exports.getStatus = async (req, res) => {
  try {
    const [record, wallet] = await Promise.all([
      DailyCheckIn.findOne({ user: req.user.id }).lean(),
      getOrCreateWallet(req.user.id),
    ]);

    return res.json({
      success: true,
      data: makeStatus(record, wallet.coins),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Could not load daily check-in.',
    });
  }
};

exports.claim = async (req, res) => {
  try {
    const now = new Date();
    const today = dayKey(now);

    const result = await runFinancialTransaction(async (session) => {
      let record = await DailyCheckIn.findOne({ user: req.user.id }).session(session);

      if (record?.lastClaimDay === today) {
        const wallet = await getOrCreateWallet(req.user.id, session);
        return {
          alreadyClaimed: true,
          reward: 0,
          wallet,
          record,
        };
      }

      const yesterday = previousDayKey(now);
      const previousStreak = Math.max(0, Math.min(7, Number(record?.streak || 0)));
      const continues = record?.lastClaimDay === yesterday && previousStreak > 0 && previousStreak < 7;
      const newStreak = continues ? previousStreak + 1 : 1;
      const reward = DAILY_CHECKIN_REWARDS[newStreak - 1];

      if (!record) {
        record = new DailyCheckIn({ user: req.user.id });
      }

      if (newStreak === 7 && previousStreak !== 7) {
        record.completedCycles = Number(record.completedCycles || 0) + 1;
      }

      record.streak = newStreak;
      record.lastClaimDay = today;
      record.lastClaimAt = now;
      await record.save({ session });

      const wallet = await creditRewardCoins({
        user: req.user.id,
        coins: reward,
        transactionType: 'daily_checkin',
        referenceType: 'daily_checkin',
        referenceId: today,
        metadata: {
          day: newStreak,
          streak: newStreak,
          reward,
        },
        session,
      });

      return {
        alreadyClaimed: false,
        reward,
        wallet,
        record,
      };
    });

    return res.json({
      success: true,
      message: result.alreadyClaimed
        ? 'Today\'s check-in reward was already claimed.'
        : `Check-in complete. +${result.reward} coins added.`,
      reward: result.reward,
      data: makeStatus(result.record, result.wallet.coins, now),
    });
  } catch (err) {
    // A unique-user race can happen only if the same account sends the very first
    // claim twice at exactly the same moment. Return the authoritative status.
    if (err?.code === 11000) {
      try {
        const [record, wallet] = await Promise.all([
          DailyCheckIn.findOne({ user: req.user.id }).lean(),
          getOrCreateWallet(req.user.id),
        ]);
        return res.status(409).json({
          success: false,
          message: 'This daily reward has already been claimed.',
          data: makeStatus(record, wallet.coins),
        });
      } catch (_) {}
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'Could not claim daily check-in reward.',
    });
  }
};
