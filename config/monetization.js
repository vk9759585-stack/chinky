/** Server-authoritative CHINKY monetization rules. */
// Currency names:
 // - Mints: user purchase/spend currency.
 // - Coins: creator-earned/withdrawal currency, stored as 1/100 Coin integer minor units.
const MINTS_PER_REFERENCE_PACK = 90;
const CREATOR_COIN_MINOR_PER_REFERENCE_PACK = 2239; // 90 Mints = 22.39 Coins.
const COIN_MINOR_PER_COIN = 100;
const PAISE_PER_COIN_MINOR_NUMERATOR = 1; // 1 minor Coin = ₹0.005 = 0.5 paise.
const PAISE_PER_COIN_MINOR_DENOMINATOR = 2;
const SPARK_GIFT_MIN_FOLLOWERS = 0;

// User-side service fees. Backend-authoritative and configurable via environment.
// UI should show only the rupee fee amount, not the percentage.
const PURCHASE_USER_FEE_BPS = Math.max(0, Number(process.env.PURCHASE_USER_FEE_BPS || 0)); // no extra purchase fee
const WITHDRAW_USER_FEE_BPS = Math.max(0, Number(process.env.WITHDRAW_USER_FEE_BPS || 0)); // default 0%; 22.39 Coins = ₹11.20.

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


// CHINKY purchase packs configured for India pricing.
// Never trust a client-supplied amount. The backend resolves every amount.
const PURCHASE_COINS_PER_10_RUPEES = 0; // Legacy API field; Mints use fixed packs.
const WITHDRAW_DIAMONDS_PER_10_RUPEES = 0; // Legacy API field; Diamonds are retired.
const PURCHASE_COINS_PER_RUPEE = 0;
const WITHDRAW_COINS_PER_RUPEE = 0;
const PURCHASE_TO_WITHDRAW_MARGIN_PERCENT = 0; // Internal economics are not shown as a UI percentage.
const MINIMUM_PURCHASE_PAISE = 2900; // minimum purchase ₹29.
const MINIMUM_WITHDRAWAL_COIN_MINOR = 100000; // 1000.00 Coins = ₹500 minimum.
const MINIMUM_WITHDRAWAL_COINS = 1000; // Legacy/display whole-Coin equivalent.
const DAILY_CHECKIN_REWARDS = Object.freeze([1, 2, 3, 4, 5, 7, 10]);

const CUSTOM_COIN_MIN = 0;
const CUSTOM_COIN_MAX = 0;
const CUSTOM_COIN_RATE_PAISE = 0; // Custom Mint recharge disabled; fixed packages protect margins.

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

const fixedPackage = (id, mints, rupees) => Object.freeze({
  id,
  amountPaise: rupees * 100,
  baseMints: mints,
  bonusMints: 0,
  mints,
  // Legacy aliases keep older app builds compatible.
  baseCoins: mints,
  bonusCoins: 0,
  coins: mints,
  discountPercent: 0,
  androidProductId: `chinky_${id}`,
  iosProductId: `chinky_${id}`,
});

const COIN_PACKAGES = Object.freeze([
  fixedPackage('mints_90', 90, 29),
  fixedPackage('mints_245', 245, 79),
  fixedPackage('mints_465', 465, 149),
  fixedPackage('mints_930', 930, 299),
  fixedPackage('mints_1550', 1550, 499),
  fixedPackage('mints_3100', 3100, 999),
]);

const getCoinPackage = (id) => COIN_PACKAGES.find((item) => item.id === id);

const quoteCustomCoins = (_) => null;

const mintsToCreatorCoinMinor = (mints) =>
  Math.max(
    0,
    Math.round(
      (Number(mints || 0) * CREATOR_COIN_MINOR_PER_REFERENCE_PACK) /
      MINTS_PER_REFERENCE_PACK
    )
  );

const splitCoins = (mints) => {
  const creatorCoinMinor = mintsToCreatorCoinMinor(mints);
  return {
    creatorCoinMinor,
    platformMints: Number(mints || 0),
    // Legacy aliases are intentionally zero/new-unit-safe.
    creatorCoins: creatorCoinMinor,
    platformCoins: Number(mints || 0),
  };
};

const coinMinorToPaise = (coinMinor) =>
  Math.max(
    0,
    Math.round(
      (Number(coinMinor || 0) * PAISE_PER_COIN_MINOR_NUMERATOR) /
      PAISE_PER_COIN_MINOR_DENOMINATOR
    )
  );
const withdrawCoinsToPaise = coinMinorToPaise;

module.exports = {
  withPurchaseFee,
  withdrawalFeePaise,
  purchaseFeePaise,
  WITHDRAW_USER_FEE_BPS,
  PURCHASE_USER_FEE_BPS,
  MINTS_PER_REFERENCE_PACK, CREATOR_COIN_MINOR_PER_REFERENCE_PACK, COIN_MINOR_PER_COIN,
  PAISE_PER_COIN_MINOR_NUMERATOR, PAISE_PER_COIN_MINOR_DENOMINATOR, SPARK_GIFT_MIN_FOLLOWERS,
  PURCHASE_COINS_PER_10_RUPEES, WITHDRAW_DIAMONDS_PER_10_RUPEES,
  PURCHASE_COINS_PER_RUPEE, WITHDRAW_COINS_PER_RUPEE, PURCHASE_TO_WITHDRAW_MARGIN_PERCENT,
  MINIMUM_PURCHASE_PAISE, MINIMUM_WITHDRAWAL_COINS, MINIMUM_WITHDRAWAL_COIN_MINOR, DAILY_CHECKIN_REWARDS,
  CUSTOM_COIN_MIN, CUSTOM_COIN_MAX, CUSTOM_COIN_RATE_PAISE,
  COIN_PACKAGES, GIFT_CATALOG, getGift, getCoinPackage, quoteCustomCoins,
  splitCoins, mintsToCreatorCoinMinor, coinMinorToPaise, withdrawCoinsToPaise,
};
