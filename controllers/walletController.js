const Wallet = require("../models/Wallet");

// ======================================
// GET WALLET
// ======================================

exports.getWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({
            user: req.user.id
        });

        if (!wallet) {
            wallet = await Wallet.create({
                user: req.user.id,
                coins: 0,
                balance: 0
            });
        }

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

exports.addCoins = async (req, res) => {
    try {
        const coins = Number(req.body.coins);

        if (!coins || coins <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid coin amount"
            });
        }

        let wallet = await Wallet.findOne({
            user: req.user.id
        });

        if (!wallet) {
            wallet = await Wallet.create({
                user: req.user.id,
                coins: 0,
                balance: 0
            });
        }

        wallet.coins += coins;

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