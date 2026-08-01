const Wallet = require("../models/Wallet");

exports.getWallet = async (req, res) => {

    try {

        let wallet = await Wallet.findOne({
            user: req.user.id
        });

        if (!wallet) {

            wallet = await Wallet.create({
                user: req.user.id
            });

        }

        res.json({
            success: true,
            data: wallet
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.addCoins = async (req, res) => {

    try {

        const wallet = await Wallet.findOne({
            user: req.user.id
        });

        wallet.coins += req.body.coins;

        await wallet.save();

        res.json({
            success: true,
            data: wallet
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};