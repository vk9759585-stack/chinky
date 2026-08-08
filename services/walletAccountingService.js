const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');

const emptyWallet = (user) => ({ user, coins: 0, balance: 0 });

async function getOrCreateWallet(user, session) {
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) options.session = session;
  return Wallet.findOneAndUpdate({ user }, { $setOnInsert: emptyWallet(user) }, options);
}

async function changeCoins({ user, delta, transactionType, referenceType, referenceId, metadata = {}, session }) {
  if (!Number.isInteger(delta) || delta === 0) throw new Error('Coin delta must be a non-zero integer');
  const wallet = await getOrCreateWallet(user, session);
  const before = wallet.coins;
  if (delta < 0 && before < -delta) throw new Error('Insufficient coin balance');
  wallet.coins = before + delta;
  if (delta > 0) wallet.totalCoinsPurchased += delta;
  if (delta < 0) {
    wallet.totalCoinsSpent += -delta;
    wallet.totalSpent += -delta;
  }
  await wallet.save({ session });
  await WalletLedger.create([{
    user,
    transactionType,
    coinDelta: delta,
    balanceBefore: before,
    balanceAfter: wallet.coins,
    referenceType,
    referenceId: String(referenceId),
    metadata,
  }], { session });
  return wallet;
}

async function creditCreatorEarnings({ user, coins, transactionType, referenceType, referenceId, metadata = {}, session }) {
  if (!Number.isInteger(coins) || coins <= 0) throw new Error('Creator credit must be a positive integer');
  const wallet = await getOrCreateWallet(user, session);
  const before = wallet.coins;
  wallet.coins += coins;
  wallet.totalEarned += coins;
  await wallet.save({ session });
  await WalletLedger.create([{
    user,
    transactionType,
    coinDelta: coins,
    balanceBefore: before,
    balanceAfter: wallet.coins,
    referenceType,
    referenceId: String(referenceId),
    metadata,
  }], { session });
  return wallet;
}

async function runFinancialTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { getOrCreateWallet, changeCoins, creditCreatorEarnings, runFinancialTransaction };
