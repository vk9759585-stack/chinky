/**
 * Server-authoritative monetization rules. Amounts are integers only:
 * coin values are whole Chinky Coins and money values are paise.
 */
const CREATOR_GIFT_SHARE_BPS = 7000;
const PLATFORM_GIFT_SHARE_BPS = 3000;
const SPARK_GIFT_MIN_FOLLOWERS = 5000;
const MINIMUM_WITHDRAWAL_PAISE = 50000;

const COIN_PACKAGES = Object.freeze([
  { id: 'coins_10', amountPaise: 1000, coins: 10 },
  { id: 'coins_20', amountPaise: 2000, coins: 20 },
  { id: 'coins_50', amountPaise: 5000, coins: 50 },
  { id: 'coins_100', amountPaise: 10000, coins: 100 },
  { id: 'coins_200', amountPaise: 20000, coins: 200 },
  { id: 'coins_500', amountPaise: 50000, coins: 500 },
  { id: 'coins_1000', amountPaise: 100000, coins: 1000 },
  { id: 'coins_2000', amountPaise: 200000, coins: 2000 },
  { id: 'coins_5000', amountPaise: 500000, coins: 5000 },
  { id: 'coins_10000', amountPaise: 1000000, coins: 10000 },
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
  COIN_PACKAGES,
  getCoinPackage,
  splitCoins,
};
