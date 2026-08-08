const Wallet = require("../models/Wallet");
const { COIN_PACKAGES } = require('../config/monetization');
const { getOrCreateWallet } = require('../services/walletAccountingService');

// ======================================
// GET WALLET
// ======================================

exports.getWallet = async (req, res) => {
    try {
        const wallet = await getOrCreateWallet(req.user.id);

        return res.json({
            success: true,
            data: wallet
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// ADD COINS
// ======================================

exports.addCoins = async (_, res) => res.status(405).json({
    success: false,
    message: 'Direct coin credits are disabled. Create and verify a payment order instead.',
});

// ======================================
// REMOVE COINS
// ======================================

exports.removeCoins = async (req, res) => {
    try {
        const coins = Number(req.body.coins);

        let wallet = await Wallet.findOne({
            user: req.user.id
        });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
        }

        if (wallet.coins < coins) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }

        wallet.coins -= coins;

        await wallet.save();

        return res.json({
            success: true,
            data: wallet
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getCoinPackages = (_, res) => res.json({
    success: true,
    data: COIN_PACKAGES.map(({ id, amountPaise, coins }) => ({ id, amountPaise, coins })),
});
