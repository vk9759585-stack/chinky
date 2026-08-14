/** Server-authoritative CHINKY monetization rules. */
const CREATOR_GIFT_SHARE_BPS = 5000;
const PLATFORM_GIFT_SHARE_BPS = 5000;
const SPARK_GIFT_MIN_FOLLOWERS = 0;

// User-side service fees. Backend-authoritative and configurable via environment.
// UI should show only the rupee fee amount, not the percentage.
const PURCHASE_USER_FEE_BPS = Math.max(0, Number(process.env.PURCHASE_USER_FEE_BPS || 0)); // no extra purchase fee
const WITHDRAW_USER_FEE_BPS = Math.max(0, Number(process.env.WITHDRAW_USER_FEE_BPS || 500)); // default 5%

const feeFromPaise = (amountPaise, bps) =>
  Math.max(0, Math.round((Number(amountPaise || 0) * Number(bps || 0)) / 10000));

const purchaseFeePaise = (amountPaise) => feeFromPaise(amountPaise, PURCHASE_USER_FEE_BPS);
const withdrawalFeePaise = (amountPaise) => feeFromPaise(amountPaise, WITHDRAW_USER_FEE_BPS);

const withPurchaseFee = (coinPackage) => {
  if (!coinPackage) return null;
  const baseAmountPaise = Number(coinPackage.amountPaise || 0);
  const serviceFeePaise = purchaseFeePaise(baseAmountPaise);
  return Object.freeze({
    ...coinPackage,
    baseAmountPaise,
    serviceFeePaise,
    totalAmountPaise: baseAmountPaise + serviceFeePaise,
  });
};


// TikTok-style purchase packs adapted for CHINKY India pricing.
// Never trust a client-supplied amount. The backend resolves every amount.
const PURCHASE_COINS_PER_10_RUPEES = 0; // Fixed packs only; no public rupee-to-coin rate.
const WITHDRAW_DIAMONDS_PER_10_RUPEES = 10; // 10 earned Diamonds = ₹10.
const PURCHASE_COINS_PER_RUPEE = 0;
const WITHDRAW_COINS_PER_RUPEE = 1;
const PURCHASE_TO_WITHDRAW_MARGIN_PERCENT = 0; // Internal economics are not shown as a UI percentage.
const MINIMUM_PURCHASE_PAISE = 3900; // minimum purchase ₹39
const MINIMUM_WITHDRAWAL_COINS = 500; // 500 Diamonds = ₹500 minimum.
const DAILY_CHECKIN_REWARDS = Object.freeze([1, 2, 3, 4, 5, 7, 10]);

const CUSTOM_COIN_MIN = 0;
const CUSTOM_COIN_MAX = 0;
const CUSTOM_COIN_RATE_PAISE = 0; // Custom recharge disabled; fixed packages protect margins.

const GIFT_CATALOG = Object.freeze([
  { name: 'Spark', icon: '✨', coins: 5, effectKey: 'sparkle' },
  { name: 'Heart', icon: '❤️', coins: 10, effectKey: 'heart_pop' },
  { name: 'Flower', icon: '🌸', coins: 20, effectKey: 'petals' },
  { name: 'Star', icon: '⭐', coins: 35, effectKey: 'star_burst' },
  { name: 'Rose', icon: '🌹', coins: 50, effectKey: 'rose' },
  { name: 'Crown', icon: '👑', coins: 75, effectKey: 'crown' },
  { name: 'Kiss', icon: '💋', coins: 100, effectKey: 'kiss' },
  { name: 'Love', icon: '💖', coins: 150, effectKey: 'love_rain' },
  { name: 'Diamond', icon: '💎', coins: 250, effectKey: 'diamond_burst' },
  { name: 'Celebration', icon: '🎉', coins: 500, effectKey: 'confetti' },
  { name: 'Royal', icon: '🏆', coins: 1000, effectKey: 'fullscreen_royal' },
  { name: 'Galaxy', icon: '🌌', coins: 2500, effectKey: 'fullscreen_galaxy' },
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
  fixedPackage('coins_30', 30, 39),
  fixedPackage('coins_65', 65, 79),
  fixedPackage('coins_125', 125, 149),
  fixedPackage('coins_260', 260, 299),
  fixedPackage('coins_450', 450, 499),
  fixedPackage('coins_950', 950, 999),
]);

const getCoinPackage = (id) => COIN_PACKAGES.find((item) => item.id === id);

const quoteCustomCoins = (_) => null;

const splitCoins = (coins) => {
  const creatorCoins = Math.floor((coins * CREATOR_GIFT_SHARE_BPS) / 10000);
  return { creatorCoins, platformCoins: coins - creatorCoins };
};
const withdrawCoinsToPaise = (diamonds) => Math.floor(diamonds / WITHDRAW_DIAMONDS_PER_10_RUPEES) * 1000;

module.exports = {
  withPurchaseFee,
  withdrawalFeePaise,
  purchaseFeePaise,
  WITHDRAW_USER_FEE_BPS,
  PURCHASE_USER_FEE_BPS,
  CREATOR_GIFT_SHARE_BPS, PLATFORM_GIFT_SHARE_BPS, SPARK_GIFT_MIN_FOLLOWERS,
  PURCHASE_COINS_PER_10_RUPEES, WITHDRAW_DIAMONDS_PER_10_RUPEES,
  PURCHASE_COINS_PER_RUPEE, WITHDRAW_COINS_PER_RUPEE, PURCHASE_TO_WITHDRAW_MARGIN_PERCENT,
  MINIMUM_PURCHASE_PAISE, MINIMUM_WITHDRAWAL_COINS, DAILY_CHECKIN_REWARDS,
  CUSTOM_COIN_MIN, CUSTOM_COIN_MAX, CUSTOM_COIN_RATE_PAISE,
  COIN_PACKAGES, GIFT_CATALOG, getGift, getCoinPackage, quoteCustomCoins,
  splitCoins, withdrawCoinsToPaise,
};
