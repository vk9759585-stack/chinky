const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { COIN_PACKAGES, GIFT_CATALOG, PURCHASE_COINS_PER_10_RUPEES, WITHDRAW_DIAMONDS_PER_10_RUPEES, MINIMUM_PURCHASE_PAISE, MINIMUM_WITHDRAWAL_COINS, withPurchaseFee, withdrawalFeePaise } = require('../config/monetization');
const { getOrCreateWallet, debitEarnedCoins, runFinancialTransaction } = require('../services/walletAccountingService');

exports.getWallet = async (req, res) => { try { res.json({ success: true, data: await getOrCreateWallet(req.user.id) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.addCoins = async (_, res) => res.status(405).json({ success: false, message: 'Direct coin credits are disabled.' });
exports.removeCoins = async (req, res) => { try { const coins = Math.floor(Number(req.body.coins || 0)); const w = await Wallet.findOne({ user: req.user.id }); if (!w || coins <= 0 || w.coins < coins) return res.status(400).json({ success: false, message: 'Insufficient balance' }); w.coins -= coins; await w.save(); return res.json({ success: true, data: w }); } catch (e) { return res.status(500).json({ success: false, message: e.message }); } };
exports.getCoinPackages = (_, res) => res.json({ success: true, data: COIN_PACKAGES.map(withPurchaseFee) });
exports.getGiftCatalog = (_, res) => res.json({ success: true, data: { purchaseCoinsPer10Rupees: 0, withdrawDiamondsPer10Rupees: WITHDRAW_DIAMONDS_PER_10_RUPEES, gifts: GIFT_CATALOG } });
exports.getMonetizationConfig = (_, res) => res.json({ success: true, data: { purchaseCoinsPer10Rupees: 0, withdrawDiamondsPer10Rupees: WITHDRAW_DIAMONDS_PER_10_RUPEES, minimumPurchasePaise: MINIMUM_PURCHASE_PAISE, minimumWithdrawalDiamonds: MINIMUM_WITHDRAWAL_COINS, showCommissionPercentage: false } });
exports.getActivity = async (req, res) => { try { const rows = await WalletLedger.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).lean(); return res.json({ success: true, data: rows.map(x => ({ id: String(x._id), type: x.transactionType, coinDelta: x.coinDelta || 0, earningDeltaPaise: x.earningDeltaPaise || 0, createdAt: x.createdAt, metadata: x.metadata || {} })) }); } catch (_) { return res.status(500).json({ success: false, message: 'Wallet activity could not be loaded.' }); } };
exports.createWithdrawalRequest = async (req, res) => {
  const coins = Math.floor(Number(req.body.coins || 0));
  const upiId = String(req.body.upiId || '').trim().toLowerCase();
  if (coins < MINIMUM_WITHDRAWAL_COINS) {
    return res.status(400).json({ success: false, message: `Minimum withdrawal is ${MINIMUM_WITHDRAWAL_COINS} earned coins.` });
  }
  if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i.test(upiId)) {
    return res.status(400).json({ success: false, message: 'Enter a valid UPI ID.' });
  }

  const blocks = Math.floor(coins / WITHDRAW_DIAMONDS_PER_10_RUPEES);
  const debitCoins = blocks * WITHDRAW_DIAMONDS_PER_10_RUPEES;
  const grossAmountPaise = blocks * 1000;
  const serviceFeePaise = withdrawalFeePaise(grossAmountPaise);
  const netAmountPaise = Math.max(0, grossAmountPaise - serviceFeePaise);

  try {
    const existing = await WithdrawalRequest.findOne({ user: req.user.id, status: 'pending' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A withdrawal request is already pending.' });
    }

    const out = await runFinancialTransaction(async session => {
      const rows = await WithdrawalRequest.create([{
        user: req.user.id,
        coins: debitCoins,
        grossAmountPaise,
        serviceFeePaise,
        amountPaise: netAmountPaise,
        upiId,
      }], { session });

      const wallet = await debitEarnedCoins({
        user: req.user.id,
        coins: debitCoins,
        transactionType: 'withdrawal_pending',
        referenceType: 'withdrawal',
        referenceId: rows[0]._id,
        metadata: { upiId, grossAmountPaise, serviceFeePaise, netAmountPaise },
        session,
      });
      return { row: rows[0], wallet };
    });

    return res.status(201).json({
      success: true,
      data: {
        id: out.row._id,
        status: out.row.status,
        coins: debitCoins,
        grossAmountPaise,
        serviceFeePaise,
        amountPaise: netAmountPaise,
        wallet: out.wallet,
      },
    });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Withdrawal request failed.' });
  }
};
exports.getWithdrawalRequests = async (req, res) => {
  const rows = await WithdrawalRequest.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).lean();
  return res.json({
    success: true,
    data: rows.map(r => ({
      id: String(r._id),
      coins: r.coins,
      grossAmountPaise: r.grossAmountPaise || r.amountPaise,
      serviceFeePaise: r.serviceFeePaise || 0,
      amountPaise: r.amountPaise,
      upiId: r.upiId,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
};
