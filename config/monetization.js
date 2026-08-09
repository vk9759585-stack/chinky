/**
 * Server-authoritative monetization rules. Amounts are integers only:
 * coin values are whole Chinky Coins and money values are paise.
 */
const CREATOR_GIFT_SHARE_BPS = 7000;
const PLATFORM_GIFT_SHARE_BPS = 3000;
const SPARK_GIFT_MIN_FOLLOWERS = 5000;
const MINIMUM_WITHDRAWAL_PAISE = 50000;

// Guaranteed 7-day login rewards. These are real CHINKY wallet coins,
// credited server-side only after a successful daily claim.
const DAILY_CHECKIN_REWARDS = Object.freeze([1, 2, 3, 4, 5, 7, 10]);

// CHINKY Coins are virtual in-app currency. Base display conversion:
// 10 coins = ₹1, therefore 1 coin = 10 paise. Server remains authoritative.
const COIN_VALUE_PAISE = 10;
const GIFT_CATALOG = Object.freeze([
  { name: 'Sawan', coins: 1 },
  { name: 'Hurts Me', coins: 2 },
  { name: 'Sawan Food', coins: 3 },
  { name: 'Peachy', coins: 5 },
  { name: 'Mor Crown', coins: 7 },
  { name: 'Wedding Mala', coins: 10 },
  { name: 'Big Kiss', coins: 15 },
  { name: 'Love U', coins: 20 },
  { name: 'Jhula Bloom', coins: 25 },
  { name: 'Sindoor', coins: 30 },
  { name: 'Monsoon Love', coins: 50 },
  { name: 'Pappi Jodi', coins: 75 },
  { name: 'Gold Rose', coins: 100 },
  { name: 'Timeless Love', coins: 200 },
  { name: 'Eternal Love', coins: 500 },
  { name: 'Rose Wedding', coins: 1000 },
]);
const getGift = (name) => GIFT_CATALOG.find((item) => item.name === name);


const COIN_PACKAGES = Object.freeze([
  { id: 'coins_10', amountPaise: 100, coins: 10, androidProductId: 'chinky_coins_10', iosProductId: 'chinky_coins_10' },
  { id: 'coins_50', amountPaise: 500, coins: 50, androidProductId: 'chinky_coins_50', iosProductId: 'chinky_coins_50' },
  { id: 'coins_100', amountPaise: 1000, coins: 100, androidProductId: 'chinky_coins_100', iosProductId: 'chinky_coins_100' },
  { id: 'coins_200', amountPaise: 2000, coins: 200, androidProductId: 'chinky_coins_200', iosProductId: 'chinky_coins_200' },
  { id: 'coins_500', amountPaise: 5000, coins: 500, androidProductId: 'chinky_coins_500', iosProductId: 'chinky_coins_500' },
  { id: 'coins_1000', amountPaise: 10000, coins: 1000, androidProductId: 'chinky_coins_1000', iosProductId: 'chinky_coins_1000' },
  { id: 'coins_2000', amountPaise: 20000, coins: 2000, androidProductId: 'chinky_coins_2000', iosProductId: 'chinky_coins_2000' },
  { id: 'coins_5000', amountPaise: 50000, coins: 5000, androidProductId: 'chinky_coins_5000', iosProductId: 'chinky_coins_5000' },
  { id: 'coins_10000', amountPaise: 100000, coins: 10000, androidProductId: 'chinky_coins_10000', iosProductId: 'chinky_coins_10000' },
]);

const getCoinPackage = (packageId) => COIN_PACKAGES.find((item) => item.id === packageId);
const splitCoins = (coins) => ({
  creatorCoins: Math.floor((coins * CREATOR_GIFT_SHARE_BPS) / 10000),
  platformCoins: coins - Math.floor((coins * CREATOR_GIFT_SHARE_BPS) / 10000),
});

module.exports = {
  CREATOR_GIFT_SHARE_BPS,
  PLATFORM_GIFT_SHARE_BPS,
  SPARK_GIFT_MIN_FOLLOWERS,
  MINIMUM_WITHDRAWAL_PAISE,
  DAILY_CHECKIN_REWARDS,
  COIN_VALUE_PAISE,
  GIFT_CATALOG,
  getGift,
  COIN_PACKAGES,
  getCoinPackage,
  splitCoins,
};
