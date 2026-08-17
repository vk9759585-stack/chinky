const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');

const emptyWallet = (user) => ({ user, coins: 0, balance: 0, purchasedCoins: 0, rewardCoins: 0, earnedCoins: 0, earnedCoinMinor: 0 });

async function getOrCreateWallet(user, session) {
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) options.session = session;
  return Wallet.findOneAndUpdate({ user }, { $setOnInsert: emptyWallet(user) }, options);
}

function normalizeBuckets(wallet) {
  wallet.purchasedCoins = Math.max(0, Math.floor(Number(wallet.purchasedCoins || 0)));
  wallet.rewardCoins = Math.max(0, Math.floor(Number(wallet.rewardCoins || 0)));
  wallet.earnedCoins = Math.max(0, Number(wallet.earnedCoins || 0)); // legacy Diamonds/Coins only.
  wallet.earnedCoinMinor = Math.max(0, Math.floor(Number(wallet.earnedCoinMinor || 0)));

  // Value-preserving migration from the old ₹1-per-Diamond system:
  // 1 old earned unit (₹1) => 2 new Coins => 200 minor.
  if (wallet.earnedCoinMinor === 0 && wallet.earnedCoins > 0) {
    wallet.earnedCoinMinor = Math.round(wallet.earnedCoins * 200);
    wallet.earnedCoins = 0;
  }

  // `coins` is now the legacy database field holding total Mints only.
  const mintBuckets = wallet.purchasedCoins + wallet.rewardCoins;
  const legacyTotal = Math.max(0, Math.floor(Number(wallet.coins || 0)));
  if (mintBuckets < legacyTotal) {
    wallet.rewardCoins += (legacyTotal - mintBuckets);
  }
  wallet.coins = wallet.purchasedCoins + wallet.rewardCoins;
}

function debitBuckets(wallet, amount) {
  normalizeBuckets(wallet);
  let remaining = amount;
  for (const key of ['purchasedCoins', 'rewardCoins', 'earnedCoins']) {
    const take = Math.min(wallet[key], remaining);
    wallet[key] -= take;
    remaining -= take;
    if (!remaining) break;
  }
  if (remaining > 0) throw new Error('Insufficient Mint balance');
}

function debitPurchasedCoins(wallet, amount) {
  normalizeBuckets(wallet);
  if (wallet.purchasedCoins < amount) {
    const error = new Error('Not enough purchased Mints. Free reward Mints cannot be used for gifts.');
    error.code = 'PURCHASED_COINS_REQUIRED';
    throw error;
  }
  wallet.purchasedCoins -= amount;
}

async function ledger({ user, transactionType, coinDelta, before, after, referenceType, referenceId, metadata, session }) {
  await WalletLedger.create([{
    user, transactionType, coinDelta, balanceBefore: before, balanceAfter: after,
    referenceType, referenceId: String(referenceId), metadata,
  }], { session });
}

async function changeCoins({ user, delta, transactionType, referenceType, referenceId, metadata = {}, session }) {
  if (!Number.isInteger(delta) || delta === 0) throw new Error('Mint delta must be a non-zero integer');
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  const before = Number(wallet.coins || 0);
  if (delta < 0) {
    if (before < -delta) throw new Error('Insufficient Mint balance');
    const purchasedOnly = ['spark_gift_sent', 'live_gift_sent', 'gift_sent'].includes(transactionType);
    if (purchasedOnly) {
      debitPurchasedCoins(wallet, -delta);
    } else {
      debitBuckets(wallet, -delta);
    }
    wallet.totalCoinsSpent += -delta;
    wallet.totalSpent += -delta;
  } else if (transactionType === 'coin_purchase') {
    wallet.purchasedCoins += delta;
    wallet.totalCoinsPurchased += delta;
  } else {
    wallet.rewardCoins += delta;
  }
  wallet.coins = before + delta;
  await wallet.save({ session });
  await ledger({ user, transactionType, coinDelta: delta, before, after: wallet.coins, referenceType, referenceId, metadata, session });
  return wallet;
}

async function creditRewardCoins({ user, coins, transactionType, referenceType, referenceId, metadata = {}, session }) {
  if (!Number.isInteger(coins) || coins <= 0) throw new Error('Reward Mint credit must be a positive integer');
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  const before = Number(wallet.coins || 0);
  wallet.coins = before + coins;
  wallet.rewardCoins += coins;
  wallet.totalRewardCoins = (wallet.totalRewardCoins || 0) + coins;
  wallet.totalEarned = (wallet.totalEarned || 0) + coins;
  await wallet.save({ session });
  await ledger({ user, transactionType, coinDelta: coins, before, after: wallet.coins, referenceType, referenceId, metadata, session });
  return wallet;
}

async function creditCreatorEarnings({ user, coinMinor, coins, transactionType, referenceType, referenceId, metadata = {}, session }) {
  const amountMinor = Number.isInteger(coinMinor) ? coinMinor : Number.isInteger(coins) ? coins : 0;
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Creator Coin credit must be a positive minor-unit integer');
  }
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  wallet.earnedCoinMinor += amountMinor;
  wallet.totalEarned = Number(wallet.totalEarned || 0) + (amountMinor / 100);
  await wallet.save({ session });
  await ledger({
    user,
    transactionType,
    coinDelta: 0,
    before: Number(wallet.coins || 0),
    after: Number(wallet.coins || 0),
    referenceType,
    referenceId,
    metadata: { ...metadata, earnedCoinMinorDelta: amountMinor },
    session
  });
  return wallet;
}

async function debitEarnedCoins({ user, coinMinor, coins, transactionType, referenceType, referenceId, metadata = {}, session }) {
  const amountMinor = Number.isInteger(coinMinor) ? coinMinor : Number.isInteger(coins) ? coins : 0;
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Withdrawal Coin amount must be positive');
  }
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  if (wallet.earnedCoinMinor < amountMinor) throw new Error('Not enough withdrawable Coins');
  wallet.earnedCoinMinor -= amountMinor;
  await wallet.save({ session });
  await ledger({
    user,
    transactionType,
    coinDelta: 0,
    before: Number(wallet.coins || 0),
    after: Number(wallet.coins || 0),
    referenceType,
    referenceId,
    metadata: { ...metadata, earnedCoinMinorDelta: -amountMinor },
    session
  });
  return wallet;
}

async function runFinancialTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally { await session.endSession(); }
}

module.exports = { getOrCreateWallet, changeCoins, creditRewardCoins, creditCreatorEarnings, debitEarnedCoins, runFinancialTransaction };
