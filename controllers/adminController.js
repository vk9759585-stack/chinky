const User = require("../models/User");
const Flow = require("../models/Post");
const Report = require("../models/Report");
const Payment = require('../models/Payment');
const Gift = require('../models/Gift');
const WalletLedger = require('../models/WalletLedger');

// ===================================
// USERS
// ===================================

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message,
        });
    }
};

// ===================================
// FLOW POSTS
// ===================================

exports.getFlows = async (req, res) => {
    try {
        const flows = await Flow.find();

        res.json({
            success: true,
            data: flows,
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message,
        });
    }
};

// ===================================
// REPORTS
// ===================================

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find();

        res.json({
            success: true,
            data: reports,
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message,
        });
    }
};

// ===================================
// VERIFY USER
// ===================================

exports.verifyUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                verified: true,
            },
            {
                new: true,
            }
        );

        res.json({
            success: true,
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// ===================================
// BAN USER
// ===================================

exports.banUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                banned: true,
            },
            {
                new: true,
            }
        );

        res.json({
            success: true,
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// ===================================
// UNBAN USER
// ===================================

exports.unbanUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                banned: false,
            },
            {
                new: true,
            }
        );

        res.json({
            success: true,
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// ===================================
// MONETIZATION CONTROL CENTER
// ===================================
exports.getMonetizationOverview = async (_, res) => {
    try {
        const [payments, gifts, ledgerCount, recentLedger] = await Promise.all([
            Payment.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: '$purpose', amountPaise: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Gift.aggregate([
                { $match: { status: 'completed' } },
                { $group: {
                    _id: '$sourceType',
                    volumeCoins: { $sum: '$coins' },
                    creatorShareCoins: { $sum: '$creatorShareCoins' },
                    platformShareCoins: { $sum: '$platformShareCoins' },
                    count: { $sum: 1 },
                } },
            ]),
            WalletLedger.countDocuments(),
            WalletLedger.find().sort({ createdAt: -1 }).limit(20)
                .populate('user', 'username name').lean(),
        ]);
        return res.json({
            success: true,
            data: { payments, gifts, ledgerCount, recentLedger },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Could not load monetization overview.' });
    }
};

exports.getWalletLedger = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
        const entries = await WalletLedger.find().sort({ createdAt: -1 }).limit(limit)
            .populate('user', 'username name').lean();
        return res.json({ success: true, data: entries });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Could not load ledger entries.' });
    }
};
