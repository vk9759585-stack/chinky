/** Server-authoritative CHINKY monetization rules. */
const CREATOR_GIFT_SHARE_BPS = 7000;
const PLATFORM_GIFT_SHARE_BPS = 3000;
const SPARK_GIFT_MIN_FOLLOWERS = 0;

// Final requested rates.
const PURCHASE_COINS_PER_10_RUPEES = 17; // ₹10 = 17 purchase coins
const WITHDRAW_DIAMONDS_PER_10_RUPEES = 25; // 25 diamonds = ₹10
// Legacy numeric fields remain for older clients only; UI must not show internal margins.
const PURCHASE_COINS_PER_RUPEE = PURCHASE_COINS_PER_10_RUPEES / 10;
const WITHDRAW_COINS_PER_RUPEE = WITHDRAW_DIAMONDS_PER_10_RUPEES / 10;
const PURCHASE_TO_WITHDRAW_MARGIN_PERCENT = 0;
const MINIMUM_PURCHASE_PAISE = 2000;      // ₹20
const MINIMUM_WITHDRAWAL_COINS = 50;      // 50 diamonds = ₹20
const DAILY_CHECKIN_REWARDS = Object.freeze([1, 2, 3, 4, 5, 7, 10]);

const GIFT_CATALOG = Object.freeze([
  { name: 'Spark', icon: '✨', coins: 5 },
  { name: 'Heart', icon: '❤️', coins: 10 },
  { name: 'Flower', icon: '🌸', coins: 20 },
  { name: 'Star', icon: '⭐', coins: 35 },
  { name: 'Rose', icon: '🌹', coins: 50 },
  { name: 'Crown', icon: '👑', coins: 75 },
  { name: 'Kiss', icon: '💋', coins: 100 },
  { name: 'Love', icon: '💖', coins: 150 },
  { name: 'Diamond', icon: '💎', coins: 250 },
  { name: 'Celebration', icon: '🎉', coins: 500 },
  { name: 'Royal', icon: '🏆', coins: 1000 },
  { name: 'Galaxy', icon: '🌌', coins: 2500 },
]);
const getGift = (name) => GIFT_CATALOG.find((item) => item.name === name);

const packageFor = (rupees, discountPercent = 0) => {
  const baseCoins = Math.floor((rupees * PURCHASE_COINS_PER_10_RUPEES) / 10);
  const bonusCoins = Math.floor((baseCoins * discountPercent) / 100);
  return Object.freeze({
    id: `coins_${rupees}`,
    amountPaise: rupees * 100,
    baseCoins,
    bonusCoins,
    discountPercent,
    coins: baseCoins + bonusCoins,
    androidProductId: `chinky_coins_${rupees}`,
    iosProductId: `chinky_coins_${rupees}`,
  });
};

const COIN_PACKAGES = Object.freeze([
  packageFor(20),
  packageFor(49),
  packageFor(99),
  packageFor(199),
  packageFor(499, 5),
  packageFor(999, 8),
  packageFor(1999, 10),
]);
const getCoinPackage = (id) => COIN_PACKAGES.find((item) => item.id === id);
const splitCoins = (coins) => { const creatorCoins = Math.floor((coins * CREATOR_GIFT_SHARE_BPS) / 10000); return { creatorCoins, platformCoins: coins - creatorCoins }; };
const withdrawCoinsToPaise = (diamonds) => Math.floor(diamonds / WITHDRAW_DIAMONDS_PER_10_RUPEES) * 1000;

module.exports = {
  CREATOR_GIFT_SHARE_BPS, PLATFORM_GIFT_SHARE_BPS, SPARK_GIFT_MIN_FOLLOWERS,
  PURCHASE_COINS_PER_10_RUPEES, WITHDRAW_DIAMONDS_PER_10_RUPEES, PURCHASE_COINS_PER_RUPEE, WITHDRAW_COINS_PER_RUPEE, PURCHASE_TO_WITHDRAW_MARGIN_PERCENT,
  MINIMUM_PURCHASE_PAISE, MINIMUM_WITHDRAWAL_COINS, DAILY_CHECKIN_REWARDS,
  COIN_PACKAGES, GIFT_CATALOG, getGift, getCoinPackage, splitCoins, withdrawCoinsToPaise,
};
