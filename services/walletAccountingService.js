const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');

const emptyWallet = (user) => ({ user, coins: 0, balance: 0, purchasedCoins: 0, rewardCoins: 0, earnedCoins: 0 });

async function getOrCreateWallet(user, session) {
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) options.session = session;
  return Wallet.findOneAndUpdate({ user }, { $setOnInsert: emptyWallet(user) }, options);
}

function normalizeBuckets(wallet) {
  wallet.purchasedCoins = Math.max(0, Number(wallet.purchasedCoins || 0));
  wallet.rewardCoins = Math.max(0, Number(wallet.rewardCoins || 0));
  wallet.earnedCoins = Math.max(0, Number(wallet.earnedCoins || 0));
  // Backward compatibility for wallets created before buckets existed.
  const bucketTotal = wallet.purchasedCoins + wallet.rewardCoins + wallet.earnedCoins;
  const legacyTotal = Math.max(0, Number(wallet.coins || 0));
  if (bucketTotal < legacyTotal) wallet.rewardCoins += (legacyTotal - bucketTotal);
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
  if (remaining > 0) throw new Error('Insufficient coin balance');
}

function debitPurchasedCoins(wallet, amount) {
  normalizeBuckets(wallet);
  if (wallet.purchasedCoins < amount) {
    const error = new Error('Not enough purchased Coins. Free reward Coins cannot be used for gifts.');
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
  if (!Number.isInteger(delta) || delta === 0) throw new Error('Coin delta must be a non-zero integer');
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  const before = Number(wallet.coins || 0);
  if (delta < 0) {
    if (before < -delta) throw new Error('Insufficient coin balance');
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
  if (!Number.isInteger(coins) || coins <= 0) throw new Error('Reward credit must be a positive integer');
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

async function creditCreatorEarnings({ user, coins, transactionType, referenceType, referenceId, metadata = {}, session }) {
  if (!Number.isInteger(coins) || coins <= 0) throw new Error('Creator credit must be a positive integer');
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  const before = Number(wallet.coins || 0);
  wallet.coins = before + coins;
  wallet.earnedCoins += coins;
  wallet.totalEarned = (wallet.totalEarned || 0) + coins;
  await wallet.save({ session });
  await ledger({ user, transactionType, coinDelta: coins, before, after: wallet.coins, referenceType, referenceId, metadata, session });
  return wallet;
}

async function debitEarnedCoins({ user, coins, transactionType, referenceType, referenceId, metadata = {}, session }) {
  if (!Number.isInteger(coins) || coins <= 0) throw new Error('Withdrawal coin amount must be positive');
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  if (wallet.earnedCoins < coins) throw new Error('Not enough withdrawable coins');
  const before = Number(wallet.coins || 0);
  wallet.earnedCoins -= coins;
  wallet.coins = Math.max(0, before - coins);
  await wallet.save({ session });
  await ledger({ user, transactionType, coinDelta: -coins, before, after: wallet.coins, referenceType, referenceId, metadata, session });
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
