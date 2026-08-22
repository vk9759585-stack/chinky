const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');
const {
  CREATOR_COIN_MINOR_PER_REFERENCE_PACK,
  MINTS_PER_REFERENCE_PACK,
} = require('../config/monetization');

const emptyWallet = (user) => ({ user, coins: 0, balance: 0, purchasedCoins: 0, rewardCoins: 0, earnedCoins: 0, earnedCoinMinor: 0 });

async function getOrCreateWallet(user, session) {
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) options.session = session;
  const wallet = await Wallet.findOneAndUpdate(
    { user },
    { $setOnInsert: emptyWallet(user) },
    options
  );

  const before = JSON.stringify({
    coins: wallet.coins,
    purchasedCoins: wallet.purchasedCoins,
    rewardCoins: wallet.rewardCoins,
    earnedCoins: wallet.earnedCoins,
    earnedCoinMinor: wallet.earnedCoinMinor,
  });
  normalizeBuckets(wallet);
  const after = JSON.stringify({
    coins: wallet.coins,
    purchasedCoins: wallet.purchasedCoins,
    rewardCoins: wallet.rewardCoins,
    earnedCoins: wallet.earnedCoins,
    earnedCoinMinor: wallet.earnedCoinMinor,
  });
  if (before !== after) {
    await wallet.save(session ? { session } : undefined);
  }
  return wallet;
}

function normalizeBuckets(wallet) {
  wallet.purchasedCoins = Math.max(0, Math.floor(Number(wallet.purchasedCoins || 0)));
  wallet.rewardCoins = Math.max(0, Math.floor(Number(wallet.rewardCoins || 0)));

  // Old builds stored creator earnings in `earnedCoins` and also included that
  // amount inside the legacy total `coins`. Preserve the old rupee value once,
  // but never duplicate it into reward Mints.
  const oldEarned = Math.max(0, Number(wallet.earnedCoins || 0));
  wallet.earnedCoinMinor = Math.max(0, Math.floor(Number(wallet.earnedCoinMinor || 0)));
  wallet.creatorConversionRemainder = Math.max(
    0,
    Math.min(
      MINTS_PER_REFERENCE_PACK - 1,
      Math.floor(Number(wallet.creatorConversionRemainder || 0))
    )
  );
  wallet.totalCreatorCoinMinor = Math.max(
    0,
    Math.floor(Number(wallet.totalCreatorCoinMinor || 0))
  );
  const legacyTotal = Math.max(0, Math.floor(Number(wallet.coins || 0)));

  let legacyMintTotal = legacyTotal;
  if (wallet.earnedCoinMinor === 0 && oldEarned > 0) {
    // Old earned unit was ₹1. New Coin is ₹0.50, so 1 old unit = 2.00 Coins.
    wallet.earnedCoinMinor = Math.round(oldEarned * 200);
    legacyMintTotal = Math.max(0, legacyTotal - Math.floor(oldEarned));
    wallet.earnedCoins = 0;
  } else {
    wallet.earnedCoins = 0;
  }

  const knownMints = wallet.purchasedCoins + wallet.rewardCoins;
  if (knownMints < legacyMintTotal) {
    wallet.rewardCoins += (legacyMintTotal - knownMints);
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
    debitBuckets(wallet, -delta);
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

async function creditCreatorGiftEarnings({
  user,
  mints,
  transactionType,
  referenceType,
  referenceId,
  metadata = {},
  session
}) {
  if (!Number.isInteger(mints) || mints <= 0) {
    throw new Error('Gift Mint amount must be a positive integer');
  }

  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);

  const numerator =
    (mints * CREATOR_COIN_MINOR_PER_REFERENCE_PACK) +
    wallet.creatorConversionRemainder;
  const amountMinor = Math.floor(numerator / MINTS_PER_REFERENCE_PACK);
  wallet.creatorConversionRemainder = numerator % MINTS_PER_REFERENCE_PACK;

  if (amountMinor <= 0) {
    throw new Error('Gift is too small to credit creator Coins');
  }

  wallet.earnedCoinMinor += amountMinor;
  wallet.totalCreatorCoinMinor += amountMinor;
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
    metadata: {
      ...metadata,
      giftMints: mints,
      earnedCoinMinorDelta: amountMinor,
      conversionRemainder: wallet.creatorConversionRemainder,
    },
    session
  });

  return {
    wallet,
    creditedCoinMinor: amountMinor,
    conversionRemainder: wallet.creatorConversionRemainder,
  };
}

async function creditCreatorEarnings({ user, coinMinor, coins, transactionType, referenceType, referenceId, metadata = {}, session }) {
  const amountMinor = Number.isInteger(coinMinor) ? coinMinor : Number.isInteger(coins) ? coins : 0;
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Creator Coin credit must be a positive minor-unit integer');
  }
  const wallet = await getOrCreateWallet(user, session);
  normalizeBuckets(wallet);
  wallet.earnedCoinMinor += amountMinor;
  wallet.totalCreatorCoinMinor =
      Math.max(0, Number(wallet.totalCreatorCoinMinor || 0)) + amountMinor;
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

module.exports = { getOrCreateWallet, changeCoins, creditRewardCoins, creditCreatorEarnings, creditCreatorGiftEarnings, debitEarnedCoins, runFinancialTransaction };
