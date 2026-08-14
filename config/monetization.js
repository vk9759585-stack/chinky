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
const MINIMUM_PURCHASE_PAISE = 3900; // minimum purchase ₹39
const MINIMUM_WITHDRAWAL_COINS = 850; // 850 Diamonds = ₹500 minimum
const DAILY_CHECKIN_REWARDS = Object.freeze([1, 2, 3, 4, 5, 7, 10]);

const CUSTOM_COIN_MIN = 66;
const CUSTOM_COIN_MAX = 2500000;
const CUSTOM_COIN_RATE_PAISE = 123; // ₹1.23 per coin for custom recharge.

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
  fixedPackage('coins_66', 66, 39),
  fixedPackage('coins_134', 134, 79),
  fixedPackage('coins_253', 253, 149),
  fixedPackage('coins_508', 508, 299),
  fixedPackage('coins_848', 848, 499),
  fixedPackage('coins_1698', 1698, 999),
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
