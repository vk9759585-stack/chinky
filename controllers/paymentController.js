const razorpay = require("../config/razorpay");
const crypto = require('crypto');
const Payment = require('../models/Payment');
const { getCoinPackage } = require('../config/monetization');
const { changeCoins, getOrCreateWallet, runFinancialTransaction } = require('../services/walletAccountingService');

const paymentUnavailable = (res) => {
    return res.status(503).json({
        success: false,
        message: 'Payments are currently unavailable on this server.',
    });
};

exports.getCoinCheckoutConfig = (_, res) => res.json({
    success: true,
    key: process.env.RAZORPAY_KEY || null,
    enabled: Boolean(razorpay && process.env.RAZORPAY_KEY),
    upiEnabled: Boolean(razorpay && process.env.RAZORPAY_KEY),
    coinValuePaise: require('../config/monetization').COIN_VALUE_PAISE,
});

exports.createCoinOrder = async (req, res) => {
    if (!razorpay) return paymentUnavailable(res);
    try {
        const coinPackage = getCoinPackage(String(req.body.packageId || ''));
        if (!coinPackage) return res.status(400).json({ success: false, message: 'Invalid coin package.' });
        const order = await razorpay.orders.create({
            amount: coinPackage.amountPaise,
            currency: 'INR',
            receipt: `coins_${req.user.id}_${Date.now()}`.slice(0, 40),
            notes: { userId: String(req.user.id), packageId: coinPackage.id, channel: 'upi_or_razorpay' },
        });
        await Payment.create({
            user: req.user.id,
            orderId: order.id,
            amount: coinPackage.amountPaise,
            currency: 'INR',
            purpose: 'coins',
            packageId: coinPackage.id,
            coins: coinPackage.coins,
            description: `Chinky Coins: ${coinPackage.id}`,
        });
        return res.status(201).json({
            success: true,
            data: { orderId: order.id, amountPaise: coinPackage.amountPaise, currency: 'INR', packageId: coinPackage.id },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Could not create coin payment order.' });
    }
};

exports.verifyCoinPayment = async (req, res) => {
    const secret = process.env.RAZORPAY_SECRET;
    if (!razorpay || !secret) return paymentUnavailable(res);

    const { orderId, paymentId, signature } = req.body;
    if (![orderId, paymentId, signature].every((value) => typeof value === 'string' && value.trim())) {
        return res.status(400).json({ success: false, message: 'Payment verification details are required.' });
    }
    if (!/^[a-f0-9]{64}$/i.test(signature)) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
    const expected = crypto.createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
    try {
        const wallet = await runFinancialTransaction(async (session) => {
            const payment = await Payment.findOne({ user: req.user.id, orderId }).session(session);
            if (!payment || payment.purpose !== 'coins') throw new Error('Payment order not found');
            if (payment.status === 'paid') return getOrCreateWallet(req.user.id, session);
            const duplicate = await Payment.findOne({ paymentId, status: 'paid' }).session(session);
            if (duplicate) throw new Error('Payment has already been processed');
            payment.paymentId = paymentId;
            payment.signature = signature;
            payment.status = 'paid';
            payment.processedAt = new Date();
            await payment.save({ session });
            return changeCoins({
                user: req.user.id,
                delta: payment.coins,
                transactionType: 'coin_purchase',
                referenceType: 'payment',
                referenceId: payment._id,
                metadata: { orderId: payment.orderId, paymentId, packageId: payment.packageId, amountPaise: payment.amount },
                session,
            });
        });
        return res.json({ success: true, data: wallet });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message || 'Coin payment could not be verified.' });
    }
};



// ======================================
// GOOGLE PLAY / APP STORE COIN PURCHASE
// ======================================
exports.verifyStoreCoinPurchase = async (req, res) => {
    const { platform, productId, purchaseId, verificationData } = req.body || {};
    if (!['android', 'ios'].includes(platform) || !productId) {
        return res.status(400).json({ success: false, message: 'Valid store platform and product id are required.' });
    }
    const { COIN_PACKAGES } = require('../config/monetization');
    const coinPackage = COIN_PACKAGES.find((item) =>
        (platform === 'android' ? item.androidProductId : item.iosProductId) === productId
    );
    if (!coinPackage) return res.status(400).json({ success: false, message: 'Unknown coin store product.' });

    try {
        const { verifyStorePurchase } = require('../services/storePurchaseVerificationService');
        const verified = await verifyStorePurchase({ platform, productId, purchaseId, verificationData });
        const StorePurchase = require('../models/StorePurchase');

        const wallet = await runFinancialTransaction(async (session) => {
            const duplicateQuery = verified.purchaseToken
                ? { platform, purchaseToken: verified.purchaseToken }
                : { platform, transactionId: verified.transactionId };
            const existing = await StorePurchase.findOne(duplicateQuery).session(session);
            if (existing) {
                if (String(existing.user) !== String(req.user.id)) throw new Error('This store purchase was already used by another account.');
                return getOrCreateWallet(req.user.id, session);
            }

            const record = await StorePurchase.create([{
                user: req.user.id,
                platform,
                productId,
                packageId: coinPackage.id,
                coins: coinPackage.coins,
                transactionId: verified.transactionId || undefined,
                purchaseToken: verified.purchaseToken || undefined,
                status: 'verified',
                storePayload: verified.payload,
                processedAt: new Date(),
            }], { session });

            return changeCoins({
                user: req.user.id,
                delta: coinPackage.coins,
                transactionType: 'coin_purchase',
                referenceType: 'store_purchase',
                referenceId: record[0]._id,
                metadata: { platform, productId, packageId: coinPackage.id, transactionId: verified.transactionId },
                session,
            });
        });
        return res.json({ success: true, data: wallet });
    } catch (err) {
        console.error('Store coin verification failed:', err?.response?.data || err.message);
        return res.status(400).json({ success: false, message: err.message || 'Store purchase could not be verified.' });
    }
};

// ======================================
// CREATE ORDER
// ======================================

exports.createOrder = async (req, res) => {
    if (!razorpay) return paymentUnavailable(res);
    try {
        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            order
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
