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

        totalCoinsPurchased: { type: Number, default: 0, min: 0 },

        totalCoinsSpent: { type: Number, default: 0, min: 0 },

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
