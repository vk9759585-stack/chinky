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


exports.getWithdrawals = async (req, res) => {
  try {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const rows = await WithdrawalRequest.find({}).populate('user', 'username email').sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: rows });
  } catch (err) { return res.status(500).json({ success: false, message: 'Withdrawals could not be loaded.' }); }
};

exports.updateWithdrawalStatus = async (req, res) => {
  const status = String(req.body.status || '');
  if (!['paid', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be paid or rejected.' });
  try {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const { creditCreatorEarnings, runFinancialTransaction } = require('../services/walletAccountingService');
    const result = await runFinancialTransaction(async (session) => {
      const row = await WithdrawalRequest.findById(req.params.id).session(session);
      if (!row) throw new Error('Withdrawal not found');
      if (row.status !== 'pending') return row;
      row.status = status; row.reviewedBy = req.user.id; row.reviewedAt = new Date(); row.note = String(req.body.note || '');
      await row.save({ session });
      if (status === 'rejected') {
        await creditCreatorEarnings({ user: row.user, coins: row.coins, transactionType: 'withdrawal_refund', referenceType: 'withdrawal', referenceId: row._id, metadata: { reason: row.note }, session });
      }
      return row;
    });
    return res.json({ success: true, data: result });
  } catch (err) { return res.status(400).json({ success: false, message: err.message || 'Withdrawal could not be updated.' }); }
};

// ===================================
// MANUAL UPI COIN REQUESTS
// ===================================
exports.getUpiCoinRequests = async (req,res)=>{
  const UpiCoinRequest=require('../models/UpiCoinRequest');
  const rows=await UpiCoinRequest.find({status:req.query.status||'pending'}).populate('user','username email').sort({createdAt:-1}).limit(100).lean();
  res.json({success:true,data:rows});
};
exports.reviewUpiCoinRequest = async (req,res)=>{
  try{
    const UpiCoinRequest=require('../models/UpiCoinRequest');
    const {runFinancialTransaction,changeCoins}=require('../services/walletAccountingService');
    const decision=String(req.body.decision||'').toLowerCase();
    if(!['approved','rejected'].includes(decision))return res.status(400).json({success:false,message:'Decision must be approved or rejected.'});
    const row=await runFinancialTransaction(async(session)=>{
      const request=await UpiCoinRequest.findById(req.params.id).session(session);
      if(!request)throw new Error('Request not found');
      if(request.status!=='pending')return request;
      request.status=decision;request.reviewedBy=req.user.id;request.reviewedAt=new Date();await request.save({session});
      if(decision==='approved')await changeCoins({user:request.user,delta:request.coins,transactionType:'coin_purchase',referenceType:'upi_request',referenceId:request._id,metadata:{packageId:request.packageId,amountPaise:request.amountPaise,upiId:request.upiId},session});
      return request;
    });
    res.json({success:true,data:row});
  }catch(e){res.status(400).json({success:false,message:e.message});}
};

// ===================================
// WITHDRAWAL REQUESTS
// ===================================
exports.getWithdrawalRequests = async (req,res)=>{
  const WithdrawalRequest=require('../models/WithdrawalRequest');
  const rows=await WithdrawalRequest.find({status:req.query.status||'pending'}).populate('user','username email').sort({createdAt:-1}).limit(100).lean();
  res.json({success:true,data:rows});
};
exports.reviewWithdrawalRequest = async (req,res)=>{
  try{
    const mongoose=require('mongoose');
    const Wallet=require('../models/Wallet');
    const WalletLedger=require('../models/WalletLedger');
    const WithdrawalRequest=require('../models/WithdrawalRequest');
    const decision=String(req.body.decision||'').toLowerCase();
    if(!['approved','rejected'].includes(decision))return res.status(400).json({success:false,message:'Decision must be approved or rejected.'});
    const session=await mongoose.startSession();let out;
    try{await session.withTransaction(async()=>{
      const row=await WithdrawalRequest.findById(req.params.id).session(session);if(!row)throw new Error('Request not found');if(row.status!=='pending'){out=row;return;}
      if(decision==='approved'){
        const wallet=await Wallet.findOne({user:row.user}).session(session);if(!wallet||(wallet.earnedCoins||0)<row.coins)throw new Error('Insufficient earned coin balance');
        wallet.earnedCoins-=row.coins;wallet.totalWithdrawnPaise=(wallet.totalWithdrawnPaise||0)+row.amountPaise;await wallet.save({session});
        await WalletLedger.create([{user:row.user,transactionType:'withdrawal',coinDelta:0,earningDeltaPaise:-row.amountPaise,balanceBefore:wallet.coins,balanceAfter:wallet.coins,referenceType:'withdrawal',referenceId:String(row._id),metadata:{coins:row.coins,amountPaise:row.amountPaise,upiId:row.upiId}}],{session});
      }
      row.status=decision;row.reviewedBy=req.user.id;row.reviewedAt=new Date();await row.save({session});out=row;
    });}finally{await session.endSession();}
    res.json({success:true,data:out});
  }catch(e){res.status(400).json({success:false,message:e.message});}
};
