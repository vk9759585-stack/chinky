/** Server-authoritative CHINKY monetization rules. */
const CREATOR_GIFT_SHARE_BPS = 6000;
const PLATFORM_GIFT_SHARE_BPS = 4000;
const SPARK_GIFT_MIN_FOLLOWERS = 0;

// TikTok-style purchase packs adapted for CHINKY India pricing.
// Never trust a client-supplied amount. The backend resolves every amount.
const PURCHASE_COINS_PER_10_RUPEES = 17; // ₹10 = 17 coins
const WITHDRAW_DIAMONDS_PER_10_RUPEES = 17; // 17 earned Diamonds = ₹10; keeps creator cash value aligned with purchased coin value
const PURCHASE_COINS_PER_RUPEE = PURCHASE_COINS_PER_10_RUPEES / 10;
const WITHDRAW_COINS_PER_RUPEE = WITHDRAW_DIAMONDS_PER_10_RUPEES / 10;
const PURCHASE_TO_WITHDRAW_MARGIN_PERCENT = 0;
const MINIMUM_PURCHASE_PAISE = 2000; // minimum purchase ₹20
const MINIMUM_WITHDRAWAL_COINS = 34; // 34 Diamonds = ₹20 minimum
const DAILY_CHECKIN_REWARDS = Object.freeze([1, 2, 3, 4, 5, 7, 10]);

const CUSTOM_COIN_MIN = 30;
const CUSTOM_COIN_MAX = 2500000;
const CUSTOM_COIN_RATE_PAISE = 123; // ₹1.23 per coin for custom recharge.

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

const fixedPackage = (id, coins, rupees) => Object.freeze({
  id,
  amountPaise: rupees * 100,
  baseCoins: coins,
  bonusCoins: 0,
  discountPercent: 0,
  coins,
  androidProductId: `chinky_${id}`,
  iosProductId: `chinky_${id}`,
});

const COIN_PACKAGES = Object.freeze([
  fixedPackage('coins_34', 34, 20),
  fixedPackage('coins_83', 83, 49),
  fixedPackage('coins_168', 168, 99),
  fixedPackage('coins_338', 338, 199),
  Object.freeze({
    id: 'coins_933',
    amountPaise: 49900,
    baseCoins: 848,
    bonusCoins: 85,
    discountPercent: 10,
    coins: 933,
    androidProductId: 'chinky_coins_933',
    iosProductId: 'chinky_coins_933',
  }),
]);

const getCoinPackage = (id) => COIN_PACKAGES.find((item) => item.id === id);

const quoteCustomCoins = (rawCoins) => {
  const coins = Math.floor(Number(rawCoins || 0));
  if (!Number.isSafeInteger(coins) || coins < CUSTOM_COIN_MIN || coins > CUSTOM_COIN_MAX) return null;
  // Round up to a whole rupee so the amount is stable and user-friendly.
  const amountPaise = Math.ceil((coins * CUSTOM_COIN_RATE_PAISE) / 100) * 100;
  return Object.freeze({
    id: `custom_${coins}`,
    amountPaise,
    baseCoins: coins,
    bonusCoins: 0,
    discountPercent: 0,
    coins,
    androidProductId: '',
    iosProductId: '',
    custom: true,
  });
};

const splitCoins = (coins) => {
  const creatorCoins = Math.floor((coins * CREATOR_GIFT_SHARE_BPS) / 10000);
  return { creatorCoins, platformCoins: coins - creatorCoins };
};
const withdrawCoinsToPaise = (diamonds) => Math.floor(diamonds / WITHDRAW_DIAMONDS_PER_10_RUPEES) * 1000;

module.exports = {
  CREATOR_GIFT_SHARE_BPS, PLATFORM_GIFT_SHARE_BPS, SPARK_GIFT_MIN_FOLLOWERS,
  PURCHASE_COINS_PER_10_RUPEES, WITHDRAW_DIAMONDS_PER_10_RUPEES,
  PURCHASE_COINS_PER_RUPEE, WITHDRAW_COINS_PER_RUPEE, PURCHASE_TO_WITHDRAW_MARGIN_PERCENT,
  MINIMUM_PURCHASE_PAISE, MINIMUM_WITHDRAWAL_COINS, DAILY_CHECKIN_REWARDS,
  CUSTOM_COIN_MIN, CUSTOM_COIN_MAX, CUSTOM_COIN_RATE_PAISE,
  COIN_PACKAGES, GIFT_CATALOG, getGift, getCoinPackage, quoteCustomCoins,
  splitCoins, withdrawCoinsToPaise,
};
