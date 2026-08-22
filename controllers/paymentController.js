const razorpay = require("../config/razorpay");
const crypto = require('crypto');
const Payment = require('../models/Payment');
const { getCoinPackage, quoteCustomCoins, CUSTOM_COIN_MIN, CUSTOM_COIN_MAX, withPurchaseFee } = require('../config/monetization');
const { changeCoins, getOrCreateWallet, runFinancialTransaction } = require('../services/walletAccountingService');

const razorpayKeyId = String(
    process.env.RAZORPAY_KEY ||
    process.env.RAZORPAY_KEY_ID ||
    ''
).trim();
const razorpaySecret = String(
    process.env.RAZORPAY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    ''
).trim();
const isLiveMode = razorpayKeyId.startsWith('rzp_live_');
const isRazorpayConfigured = Boolean(
    razorpay &&
    (razorpayKeyId.startsWith('rzp_live_') || razorpayKeyId.startsWith('rzp_test_')) &&
    razorpaySecret
);

const paymentUnavailable = (res) => {
    return res.status(503).json({
        success: false,
        code: 'PAYMENT_NOT_CONFIGURED',
        message: 'Razorpay payment is not configured on the server. Please configure RAZORPAY_KEY and RAZORPAY_SECRET in backend/.env.',
    });
};

exports.getCoinCheckoutConfig = (_, res) => res.json({
    success: true,
    key: isRazorpayConfigured ? razorpayKeyId : null,
    enabled: isRazorpayConfigured,
    liveMode: isLiveMode,
    paymentMode: isRazorpayConfigured ? (isLiveMode ? 'live' : 'test') : 'disabled',
    upiEnabled: isRazorpayConfigured,
    cardsEnabled: isRazorpayConfigured,
    netbankingEnabled: isRazorpayConfigured,
    customCoinMin: CUSTOM_COIN_MIN,
    customCoinMax: CUSTOM_COIN_MAX,
    purchaseCoinsPer10Rupees: require('../config/monetization').PURCHASE_COINS_PER_10_RUPEES,
    minimumPurchasePaise: require('../config/monetization').MINIMUM_PURCHASE_PAISE,
});

exports.quoteCustomCoinPurchase = (req, res) => {
    const quote = quoteCustomCoins(req.query.coins);
    if (!quote) return res.status(400).json({ success: false, message: `Enter ${CUSTOM_COIN_MIN}-${CUSTOM_COIN_MAX} coins.` });
    return res.json({ success: true, data: quote });
};

exports.createCoinOrder = async (req, res) => {
    if (!isRazorpayConfigured) return paymentUnavailable(res);
    try {
        const requestedPackageId = String(req.body.packageId || '');
        const customCoins = req.body.customCoins;
        const rawCoinPackage = requestedPackageId ? getCoinPackage(requestedPackageId) : quoteCustomCoins(customCoins);
        const coinPackage = rawCoinPackage ? withPurchaseFee(rawCoinPackage) : null;
        if (!coinPackage) return res.status(400).json({ success: false, message: 'Invalid coin package or custom coin amount.' });

        const order = await razorpay.orders.create({
            amount: coinPackage.totalAmountPaise,
            currency: 'INR',
            receipt: `coins_${req.user.id}_${Date.now()}`.slice(0, 40),
            notes: {
                userId: String(req.user.id),
                packageId: coinPackage.id,
                coins: String(coinPackage.coins),
                channel: 'razorpay_checkout',
            },
        });
        await Payment.create({
            user: req.user.id,
            orderId: order.id,
            amount: coinPackage.totalAmountPaise,
            currency: 'INR',
            purpose: 'coins',
            packageId: coinPackage.id,
            coins: coinPackage.coins,
            mints: coinPackage.mints ?? coinPackage.coins,
            description: `Chinky Coins: ${coinPackage.id}`,
        });
        return res.status(201).json({
            success: true,
            data: {
                orderId: order.id,
                baseAmountPaise: coinPackage.baseAmountPaise,
                serviceFeePaise: coinPackage.serviceFeePaise,
                amountPaise: coinPackage.totalAmountPaise,
                currency: 'INR',
                packageId: coinPackage.id,
                coins: coinPackage.coins,
                mints: coinPackage.mints ?? coinPackage.coins,
                liveMode: isLiveMode,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Could not create coin payment order.' });
    }
};

exports.verifyCoinPayment = async (req, res) => {
    const secret = razorpaySecret;
    if (!isRazorpayConfigured) return paymentUnavailable(res);

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
        const paymentRecord = await Payment.findOne({ user: req.user.id, orderId });
        if (!paymentRecord || paymentRecord.purpose !== 'coins') {
            return res.status(404).json({ success: false, message: 'Payment order not found.' });
        }

        // Do not rely only on the client success callback. Fetch the payment
        // from Razorpay and validate order, amount, currency and capture state.
        let gatewayPayment = await razorpay.payments.fetch(paymentId);
        if (!gatewayPayment || gatewayPayment.order_id !== orderId) {
            return res.status(400).json({ success: false, message: 'Gateway order mismatch.' });
        }
        if (Number(gatewayPayment.amount) !== Number(paymentRecord.amount) || gatewayPayment.currency !== 'INR') {
            return res.status(400).json({ success: false, message: 'Gateway amount mismatch.' });
        }
        if (gatewayPayment.status === 'authorized') {
            gatewayPayment = await razorpay.payments.capture(paymentId, paymentRecord.amount, 'INR');
        }
        if (gatewayPayment.status !== 'captured') {
            return res.status(409).json({
                success: false,
                message: 'Payment has not been captured. No Mints were added.'
            });
        }
        if (!gatewayPayment.method) {
            return res.status(400).json({
                success: false,
                message: 'Payment method could not be verified. No Mints were added.'
            });
        }

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
        return res.json({
            success: true,
            paymentVerified: true,
            orderId,
            paymentId,
            creditedCoins: paymentRecord.coins,
            creditedMints: paymentRecord.coins,
            data: wallet
        });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message || 'Coin payment could not be verified.' });
    }
};




exports.getMyCoinPayments = async (req, res) => {
    const rows = await Payment.find({ user: req.user.id, purpose: 'coins' })
        .sort({ createdAt: -1 }).limit(30).lean();
    return res.json({ success: true, data: rows.map((row) => ({
        id: String(row._id), orderId: row.orderId, paymentId: row.paymentId || '',
        packageId: row.packageId || '', coins: row.coins || 0, amountPaise: row.amount,
        currency: row.currency, status: row.status, failureReason: row.failureReason || '',
        processedAt: row.processedAt, createdAt: row.createdAt,
    })) });
};

exports.recoverCoinPayment = async (req, res) => {
    if (!razorpay) return paymentUnavailable(res);
    const orderId = String(req.body.orderId || '').trim();
    if (!orderId) return res.status(400).json({ success: false, message: 'Order id is required.' });
    try {
        const record = await Payment.findOne({ user: req.user.id, orderId, purpose: 'coins' });
        if (!record) return res.status(404).json({ success: false, message: 'Payment order not found.' });
        if (record.status === 'paid') return res.json({ success: true, alreadyProcessed: true, data: await getOrCreateWallet(req.user.id) });
        const result = await razorpay.orders.fetchPayments(orderId);
        const items = Array.isArray(result?.items) ? result.items : [];
        const gatewayPayment = items.find((x) => x && x.order_id === orderId && ['captured','authorized'].includes(x.status));
        if (!gatewayPayment) return res.status(409).json({ success: false, pending: true, message: 'No completed payment was found for this order yet.' });
        if (Number(gatewayPayment.amount) !== Number(record.amount) || gatewayPayment.currency !== 'INR') {
            return res.status(400).json({ success: false, message: 'Gateway amount mismatch.' });
        }
        let paid = gatewayPayment;
        if (paid.status === 'authorized') paid = await razorpay.payments.capture(paid.id, record.amount, 'INR');
        if (paid.status !== 'captured') return res.status(409).json({ success: false, pending: true, message: 'Payment is not captured yet.' });
        const wallet = await runFinancialTransaction(async (session) => {
            const payment = await Payment.findOne({ user: req.user.id, orderId }).session(session);
            if (payment.status === 'paid') return getOrCreateWallet(req.user.id, session);
            const duplicate = await Payment.findOne({ paymentId: paid.id, status: 'paid' }).session(session);
            if (duplicate) throw new Error('Payment has already been processed');
            payment.paymentId = paid.id; payment.status = 'paid'; payment.processedAt = new Date();
            await payment.save({ session });
            return changeCoins({ user:req.user.id, delta:payment.coins, transactionType:'coin_purchase', referenceType:'payment', referenceId:payment._id, metadata:{orderId,paymentId:paid.id,packageId:payment.packageId,amountPaise:payment.amount,recovered:true}, session });
        });
        return res.json({ success: true, recovered: true, data: wallet });
    } catch (err) { return res.status(400).json({ success:false, message:err.message || 'Payment recovery failed.' }); }
};

// ======================================
// GOOGLE PLAY / APP STORE COIN PURCHASE
// ======================================
exports.verifyStoreCoinPurchase = async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Store Mint purchases are disabled. Use Razorpay live checkout.'
    });
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

exports.createUpiCoinRequest = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Manual UPI coin requests are disabled. Use Razorpay live checkout.'
  });
};

exports.getMyUpiCoinRequests = async (req, res) => {
  return res.status(410).json({
    success: false,
    data: [],
    message: 'Manual UPI requests are disabled.'
  });
};
