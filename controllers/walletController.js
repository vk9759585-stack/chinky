const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Gift = require('../models/Gift');
const { COIN_PACKAGES, GIFT_CATALOG, MINIMUM_PURCHASE_PAISE, MINIMUM_WITHDRAWAL_COIN_MINOR, withPurchaseFee, withdrawalFeePaise, coinMinorToPaise, mintsToCreatorCoinMinor } = require('../config/monetization');
const { getOrCreateWallet, debitEarnedCoins, runFinancialTransaction } = require('../services/walletAccountingService');

exports.getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    const data = wallet.toObject ? wallet.toObject() : wallet;
    const earnedMinor = Number(data.earnedCoinMinor || 0) || Math.round(Number(data.earnedCoins || 0) * 200);
    data.mints = Number(data.coins || 0);
    data.purchasedMints = Number(data.purchasedCoins || 0);
    data.rewardMints = Number(data.rewardCoins || 0);
    data.giftableMints = Number(data.coins || 0);
    data.earnedCoinMinor = earnedMinor;
    data.earnedCoinsDisplay = (earnedMinor / 100).toFixed(2);
    data.withdrawableCoins = earnedMinor / 100;
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
exports.addCoins = async (_, res) => res.status(405).json({ success: false, message: 'Direct coin credits are disabled.' });
exports.removeCoins = async (req, res) => { try { const coins = Math.floor(Number(req.body.coins || 0)); const w = await Wallet.findOne({ user: req.user.id }); if (!w || coins <= 0 || w.coins < coins) return res.status(400).json({ success: false, message: 'Insufficient balance' }); w.coins -= coins; await w.save(); return res.json({ success: true, data: w }); } catch (e) { return res.status(500).json({ success: false, message: e.message }); } };
exports.getCoinPackages = (_, res) => res.json({ success: true, data: COIN_PACKAGES.map(withPurchaseFee) });

exports.getReceivedGifts = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const receiverId = new mongoose.Types.ObjectId(req.user.id);
    const query = { receiver: receiverId, status: "completed" };

    const [rows, count, totals, senderStats] = await Promise.all([
      Gift.find(query)
        .populate("sender", "name username profileImage verified")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Gift.countDocuments(query),
      Gift.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCoins: { $sum: "$coins" },
            totalCreatorCoinMinor: { $sum: "$creatorCoinMinor" },
            totalGiftEvents: { $sum: 1 }
          }
        }
      ]),
      Gift.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$sender",
            giftCount: { $sum: 1 },
            totalCoins: { $sum: "$coins" },
            totalCreatorCoinMinor: { $sum: "$creatorCoinMinor" },
            lastGiftAt: { $max: "$createdAt" }
          }
        },
        { $sort: { totalCoins: -1, giftCount: -1, lastGiftAt: -1 } },
        { $limit: 100 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "sender"
          }
        },
        { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }
      ])
    ]);

    const totalCoins = totals[0]?.totalCoins || 0;
    const storedCreatorMinor = Number(totals[0]?.totalCreatorCoinMinor || 0);
    const totalCreatorCoinMinor = storedCreatorMinor > 0
      ? storedCreatorMinor
      : mintsToCreatorCoinMinor(totalCoins);
    const totalGiftEvents = totals[0]?.totalGiftEvents || count;

    return res.json({
      success: true,
      data: {
        count,
        totalGiftEvents,
        totalMints: totalCoins,
        totalCoins: totalCoins,
        totalCreatorCoinMinor,
        totalEarnedCoins: totalCreatorCoinMinor / 100,
        topGifters: senderStats.map(row => ({
          senderId: row._id ? String(row._id) : "",
          name: row.sender?.name || "",
          username: row.sender?.username || "",
          profileImage: row.sender?.profileImage || "",
          verified: row.sender?.verified === true,
          giftCount: row.giftCount || 0,
          totalMints: row.totalCoins || 0,
          totalCoins: row.totalCoins || 0,
          earnedCoinMinor: Number(row.totalCreatorCoinMinor || 0) > 0
            ? Number(row.totalCreatorCoinMinor)
            : mintsToCreatorCoinMinor(row.totalCoins || 0),
          earnedCoins: (Number(row.totalCreatorCoinMinor || 0) > 0
            ? Number(row.totalCreatorCoinMinor)
            : mintsToCreatorCoinMinor(row.totalCoins || 0)) / 100,
          lastGiftAt: row.lastGiftAt
        })),
        gifts: rows.map(row => ({
          id: String(row._id),
          giftName: row.giftName,
          quantity: 1,
          mints: row.coins || 0,
          coins: row.coins || 0,
          totalMints: row.coins || 0,
          totalCoins: row.coins || 0,
          creatorCoinMinor: Number(row.creatorCoinMinor || 0) || mintsToCreatorCoinMinor(row.coins || 0),
          creatorCoins: (Number(row.creatorCoinMinor || 0) || mintsToCreatorCoinMinor(row.coins || 0)) / 100,
          sourceType: row.sourceType,
          sourceId: row.sourceId,
          createdAt: row.createdAt,
          sender: row.sender ? {
            id: String(row.sender._id),
            name: row.sender.name || "",
            username: row.sender.username || "",
            profileImage: row.sender.profileImage || "",
            verified: row.sender.verified === true
          } : null
        }))
      }
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Gift history could not be loaded."
    });
  }
};

exports.getGiftCatalog = (_, res) => res.json({
  success: true,
  data: {
    currencyName: 'Mints',
    earnedCurrencyName: 'Coins',
    mintsPerReferencePack: 90,
    creatorCoinMinorPerReferencePack: 2239,
    coinsPerReferencePack: 22.39,
    rupeesPerReferenceCoinValue: 11.20,
    gifts: GIFT_CATALOG.map(g => ({ ...g, mints: g.coins }))
  }
});
exports.getMonetizationConfig = (_, res) => res.json({
  success: true,
  data: {
    currencyName: 'Mints',
    earnedCurrencyName: 'Coins',
    minimumPurchasePaise: MINIMUM_PURCHASE_PAISE,
    minimumWithdrawalCoinMinor: MINIMUM_WITHDRAWAL_COIN_MINOR,
    minimumWithdrawalCoins: MINIMUM_WITHDRAWAL_COIN_MINOR / 100,
    coinMinorPerCoin: 100,
    coinValuePaisePerCoin: 50,
    reference: { rupees: 29, mints: 90, coins: 22.39, coinValueRupees: 11.20 },
    showCommissionPercentage: false
  }
});
exports.getActivity = async (req, res) => { try { const rows = await WalletLedger.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).lean(); return res.json({ success: true, data: rows.map(x => ({ id: String(x._id), type: x.transactionType, coinDelta: x.coinDelta || 0, earningDeltaPaise: x.earningDeltaPaise || 0, createdAt: x.createdAt, metadata: x.metadata || {} })) }); } catch (_) { return res.status(500).json({ success: false, message: 'Wallet activity could not be loaded.' }); } };
exports.createWithdrawalRequest = async (req, res) => {
  const rawCoins = Number(req.body.coins ?? req.body.amountCoins ?? 0);
  const coinMinor = Math.round(rawCoins * 100);
  const upiId = String(req.body.upiId || '').trim().toLowerCase();

  if (!Number.isFinite(rawCoins) || coinMinor < MINIMUM_WITHDRAWAL_COIN_MINOR) {
    return res.status(400).json({
      success: false,
      message: `Minimum withdrawal is ${(MINIMUM_WITHDRAWAL_COIN_MINOR / 100).toFixed(2)} Coins.`
    });
  }
  if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i.test(upiId)) {
    return res.status(400).json({ success: false, message: 'Enter a valid UPI ID.' });
  }

  const grossAmountPaise = coinMinorToPaise(coinMinor);
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
        coins: coinMinor,
        grossAmountPaise,
        serviceFeePaise,
        amountPaise: netAmountPaise,
        upiId,
      }], { session });

      const wallet = await debitEarnedCoins({
        user: req.user.id,
        coinMinor,
        transactionType: 'withdrawal_pending',
        referenceType: 'withdrawal',
        referenceId: rows[0]._id,
        metadata: { upiId, grossAmountPaise, serviceFeePaise, netAmountPaise, coinMinor },
        session,
      });
      return { row: rows[0], wallet };
    });

    return res.status(201).json({
      success: true,
      data: {
        id: out.row._id,
        status: out.row.status,
        coinMinor,
        coins: coinMinor / 100,
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
  const rows = await WithdrawalRequest.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return res.json({
    success: true,
    data: rows.map(r => {
      const stored = Math.max(0, Number(r.coins || 0));
      const grossPaise = Math.max(0, Number(r.grossAmountPaise || r.amountPaise || 0));

      // New rows store Coin minor units: 2239 minor => ₹11.20.
      // Old rows stored whole old earned units. Convert old history by rupee
      // value so its displayed value remains correct after the currency rename.
      const looksLikeNewMinor =
        grossPaise > 0 && Math.abs(grossPaise - Math.round(stored / 2)) <= 1;
      const coinMinor = looksLikeNewMinor
        ? Math.round(stored)
        : grossPaise > 0
          ? Math.round(grossPaise * 2)
          : Math.round(stored);

      return {
        id: String(r._id),
        coinMinor,
        coins: coinMinor / 100,
        grossAmountPaise: grossPaise,
        serviceFeePaise: r.serviceFeePaise || 0,
        amountPaise: r.amountPaise,
        upiId: r.upiId,
        status: r.status,
        createdAt: r.createdAt,
      };
    }),
  });
};
