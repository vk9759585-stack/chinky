const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        balance: {
            type: Number,
            default: 0,
            min: 0
        },

        coins: {
            type: Number,
            default: 0,
            min: 0
        },

        purchasedCoins: { type: Number, default: 0, min: 0 },

        rewardCoins: { type: Number, default: 0, min: 0 },

        earnedCoins: { type: Number, default: 0, min: 0 },

        // Creator Coins in hundredths. Example: 22.39 Coins => 2239.
        earnedCoinMinor: { type: Number, default: 0, min: 0 },

        // Remainder for exact cumulative Mint -> creator Coin conversion.
        // Denominator is 90; keeps 90 Mints = 22.39 Coins regardless of
        // how those 90 Mints are split across multiple gifts.
        creatorConversionRemainder: { type: Number, default: 0, min: 0, max: 89 },

        totalCreatorCoinMinor: { type: Number, default: 0, min: 0 },



        totalCoinsPurchased: { type: Number, default: 0, min: 0 },

        totalCoinsSpent: { type: Number, default: 0, min: 0 },

        totalRewardCoins: { type: Number, default: 0, min: 0 },

        pendingEarningsPaise: { type: Number, default: 0, min: 0 },

        availableEarningsPaise: { type: Number, default: 0, min: 0 },

        totalEarningsPaise: { type: Number, default: 0, min: 0 },

        totalWithdrawnPaise: { type: Number, default: 0, min: 0 },

        totalEarned: {
            type: Number,
            default: 0
        },

        totalSpent: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Wallet",
    walletSchema
);
