const crypto = require("crypto");
const mongoose = require('mongoose');
const LiveSession = require('../models/LiveSession');
const User = require('../models/User');
const Gift = require('../models/Gift');
const Notification = require('../models/Notification');
const LiveBattle = require('../models/LiveBattle');
const { getGift, splitCoins } = require('../config/monetization');
const { changeCoins, creditCreatorEarnings, runFinancialTransaction } = require('../services/walletAccountingService');
const { createSocialNotification } = require("../services/socialNotificationService");

const token04 = (appID, userID, serverSecret, effectiveSeconds, payload = "") => {
  const now = Math.floor(Date.now() / 1000);
  const tokenInfo = {
    app_id: appID,
    user_id: userID,
    nonce: crypto.randomInt(-2147483648, 2147483647),
    ctime: now,
    expire: now + effectiveSeconds,
    payload,
  };
  const iv = crypto.randomBytes(8).toString("hex");
  const secret = Buffer.from(serverSecret, "utf8");
  const algorithm = `aes-${secret.length * 8}-cbc`;
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokenInfo), "utf8"), cipher.final()]);
  const expire = Buffer.alloc(8);
  expire.writeBigInt64BE(BigInt(tokenInfo.expire));
  const ivLength = Buffer.alloc(2);
  ivLength.writeUInt16BE(Buffer.byteLength(iv));
  const encryptedLength = Buffer.alloc(2);
  encryptedLength.writeUInt16BE(encrypted.length);
  return `04${Buffer.concat([expire, ivLength, Buffer.from(iv), encryptedLength, encrypted]).toString("base64")}`;
};

const serialize = (session) => ({
  liveID: session.liveID,
  hostUserId: String(session.hostUserId?._id || session.hostUserId || ''),
  hostName: session.hostName || session.hostUserId?.name || session.hostUserId?.username || 'Chinky creator',
  hostUsername: session.hostUserId?.username || '',
  hostProfileImage: session.hostUserId?.profileImage || '',
  startedAt: session.startedAt,
  endedAt: session.endedAt,
  isLive: session.isLive === true,
});

exports.createZegoToken = async (req, res) => {
  const appID = Number(process.env.ZEGO_APP_ID);
  const serverSecret = process.env.ZEGO_SERVER_SECRET || "";
  const liveID = String(req.body.liveID || "").trim();
  if (!appID || !serverSecret) return res.status(503).json({ success: false, message: "ZEGOCLOUD is not configured on the server." });
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(liveID)) return res.status(400).json({ success: false, message: "Invalid live room ID." });
  if (![16, 24, 32].includes(Buffer.byteLength(serverSecret))) return res.status(500).json({ success: false, message: "Invalid ZEGOCLOUD server secret." });
  try {
    const userID = String(req.user.id).replace(/[^A-Za-z0-9_]/g, "_");
    const user = await User.findById(req.user.id).select('name username');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const userName = user.name || user.username || 'Chinky user';
    const payload = JSON.stringify({ room_id: liveID, privilege: { 1: 1, 2: 1 }, stream_id_list: null });
    const token = token04(appID, userID, serverSecret, 3600, payload);
    return res.json({ success: true, appID, userID, userName, liveID, token, expiresIn: 3600 });
  } catch (_) {
    return res.status(500).json({ success: false, message: "Could not create live token." });
  }
};

exports.startSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name username profileImage');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await LiveSession.updateMany(
      { hostUserId: user._id, isLive: true },
      { $set: { isLive: false, endedAt: new Date() } },
    );

    const liveID = `chinky_${String(user._id).replace(/[^A-Za-z0-9]/g, '')}_${Date.now()}`;
    const session = await LiveSession.create({
      liveID,
      hostUserId: user._id,
      hostName: user.name || user.username || 'Chinky creator',
      startedAt: new Date(),
      isLive: true,
    });
    await session.populate('hostUserId', 'name username profileImage');
    return res.status(201).json({ success: true, data: serialize(session) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ liveID: req.params.liveID }).populate('hostUserId', 'name username profileImage');
    if (!session) return res.status(404).json({ success: false, message: 'Live session not found' });
    return res.json({ success: true, data: serialize(session) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.activeForUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) return res.json({ success: true, data: null });
    const session = await LiveSession.findOne({ hostUserId: req.params.userId, isLive: true })
      .sort({ startedAt: -1 })
      .populate('hostUserId', 'name username profileImage');
    return res.json({ success: true, data: session ? serialize(session) : null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.activeSessions = async (req, res) => {
  try {
    const ids = String(req.query.userIds || '').split(',').map((v) => v.trim()).filter((v) => mongoose.isValidObjectId(v)).slice(0, 100);
    const query = { isLive: true };
    if (ids.length) query.hostUserId = { $in: ids };
    const sessions = await LiveSession.find(query).sort({ startedAt: -1 }).limit(100).populate('hostUserId', 'name username profileImage');
    return res.json({ success: true, data: sessions.map(serialize) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ liveID: req.params.liveID });
    if (!session) return res.json({ success: true });
    if (String(session.hostUserId) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Only the host can end this live.' });
    session.isLive = false;
    session.endedAt = new Date();
    await session.save();
    return res.json({ success: true, data: serialize(session) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendGift = async (req, res) => {
  try {
    const sessionDoc = await LiveSession.findOne({ liveID: req.params.liveID, isLive: true });
    if (!sessionDoc) return res.status(404).json({ success: false, message: 'Live is no longer active.' });
    if (String(sessionDoc.hostUserId) === String(req.user.id)) return res.status(400).json({ success: false, message: 'You cannot gift yourself.' });
    const selectedGift = getGift(req.body.giftName);
    if (!selectedGift) return res.status(400).json({ success: false, message: 'Invalid gift' });
    const { creatorCoinMinor, platformMints } = splitCoins(selectedGift.coins);
    const result = await runFinancialTransaction(async (dbSession) => {
      const created = await Gift.create([{
        sender: req.user.id,
        receiver: sessionDoc.hostUserId,
        giftName: selectedGift.name,
        coins: selectedGift.coins,
        sourceType: 'live',
        sourceId: sessionDoc.liveID,
        creatorShareCoins: 0,
                creatorCoinMinor,
                platformShareMints: platformMints,
        platformShareCoins: 0,
        effectKey: selectedGift.coins >= 1000 ? 'fullscreen' : selectedGift.coins >= 250 ? 'burst' : 'pop',
      }], { session: dbSession });
      const gift = created[0];
      const senderWallet = await changeCoins({
        user: req.user.id,
        delta: -selectedGift.coins,
        transactionType: 'live_gift_sent',
        referenceType: 'gift',
        referenceId: gift._id,
        metadata: { liveID: sessionDoc.liveID, giftName: selectedGift.name },
        session: dbSession,
      });
      await creditCreatorEarnings({
        user: sessionDoc.hostUserId,
        coinMinor: creatorCoinMinor,
        transactionType: 'live_gift_received',
        referenceType: 'gift',
        referenceId: gift._id,
        metadata: { liveID: sessionDoc.liveID, giftName: selectedGift.name },
        session: dbSession,
      });
      return { senderWallet, gift };
    });
    const activeBattle = await LiveBattle.findOne({ liveID: sessionDoc.liveID, status: "active" });
    if (activeBattle) {
      if (String(activeBattle.host) === String(sessionDoc.hostUserId)) activeBattle.hostScore += selectedGift.coins;
      else if (String(activeBattle.opponent) === String(sessionDoc.hostUserId)) activeBattle.opponentScore += selectedGift.coins;
      await activeBattle.save();
      req.app.get("io")?.to(`live:${sessionDoc.liveID}`).emit("live:battle-score", activeBattle.toObject());
    }
    await createSocialNotification(req, {
            sender: req.user.id,
            receiver: sessionDoc.hostUserId,
            type: "gift",
            title: "New Live gift",
            body: `${selectedGift.name} • ${selectedGift.coins} Mints`,
            link: `/live/${sessionDoc.liveID}`
        }).catch(() => null);
    req.app.get("io")?.to(`user:${String(sessionDoc.hostUserId)}`).emit('gift:received', { sourceType: 'live', sourceId: sessionDoc.liveID, giftName: selectedGift.name, mints: selectedGift.coins, coins: selectedGift.coins });
    req.app.get("io")?.to(`live:${sessionDoc.liveID}`).emit('live:gift', { giftName: selectedGift.name, mints: selectedGift.coins, coins: selectedGift.coins, senderId: String(req.user.id), effectKey: result.gift.effectKey });
    return res.json({ success: true, mints: result.senderWallet.coins, coins: result.senderWallet.coins, gift: { id: result.gift._id, name: result.gift.giftName, mints: result.gift.coins, coins: result.gift.coins, creatorCoins: result.gift.creatorCoinMinor / 100, effectKey: result.gift.effectKey } });
  } catch (error) {
    const status = String(error.message || '').includes('Insufficient') ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};