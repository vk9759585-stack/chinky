const crypto = require('crypto');
const mongoose = require('mongoose');
const FamilyPairing = require('../models/FamilyPairing');
const User = require('../models/User');

function viewerId(req) {
  return String(req.user?.id || req.user?._id || req.user?.userId || '');
}

function safeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name || '',
    username: user.username || '',
    profileImage: user.profileImage || '',
    verified: user.verified === true,
  };
}

function generateCode() {
  return crypto.randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
}

exports.searchTeen = async (req, res) => {
  try {
    const parentId = viewerId(req);
    const query = String(req.query.username || '').trim().replace(/^@/, '');
    if (query.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      _id: { $ne: parentId },
      username: expression,
      following: parentId,
      isDeactivated: { $ne: true },
      banned: { $ne: true },
    })
      .select('name username profileImage verified')
      .limit(20)
      .lean();

    const teenIds = users.map((u) => u._id);
    const active = await FamilyPairing.find({ teen: { $in: teenIds }, status: 'active' })
      .select('teen parent')
      .lean();
    const activeMap = new Map(active.map((row) => [String(row.teen), String(row.parent)]));

    return res.json({
      success: true,
      data: users.map((u) => ({
        ...safeUser(u),
        canPair: !activeMap.has(String(u._id)) || activeMap.get(String(u._id)) === parentId,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Teen search could not be completed.' });
  }
};

exports.linkTeen = async (req, res) => {
  try {
    const parentId = viewerId(req);
    const teenId = String(req.body.teenUserId || '');
    if (!mongoose.Types.ObjectId.isValid(teenId) || teenId === parentId) {
      return res.status(400).json({ success: false, message: 'Choose a valid teen account.' });
    }

    const teen = await User.findById(teenId).select('name username profileImage verified following').lean();
    if (!teen) return res.status(404).json({ success: false, message: 'Account not found.' });
    const followsParent = (teen.following || []).some((id) => String(id) === parentId);
    if (!followsParent) {
      return res.status(400).json({
        success: false,
        message: 'This account must follow you before you can link by username.',
      });
    }

    const other = await FamilyPairing.findOne({ teen: teenId, status: 'active', parent: { $ne: parentId } }).lean();
    if (other) {
      return res.status(409).json({ success: false, message: 'This account is already paired.' });
    }

    let pairing = await FamilyPairing.findOne({ parent: parentId, teen: teenId });
    if (!pairing) pairing = new FamilyPairing({ parent: parentId, teen: teenId });
    pairing.status = 'active';
    pairing.pairedAt = new Date();
    await pairing.save();

    return res.status(201).json({
      success: true,
      data: { id: String(pairing._id), status: pairing.status, teen: safeUser(teen), controls: pairing.controls },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Family account could not be linked.' });
  }
};

exports.createInvite = async (req, res) => {
  try {
    const parentId = viewerId(req);
    await FamilyPairing.deleteMany({ parent: parentId, teen: null, status: 'pending' });
    let inviteCode = generateCode();
    while (await FamilyPairing.exists({ inviteCode, status: 'pending' })) inviteCode = generateCode();
    const row = await FamilyPairing.create({ parent: parentId, inviteCode, status: 'pending' });
    return res.status(201).json({
      success: true,
      data: {
        id: String(row._id),
        inviteCode,
        inviteLink: `https://chinkyapp.com/family/invite/${inviteCode}`,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Invite could not be created.' });
  }
};

exports.joinInvite = async (req, res) => {
  try {
    const teenId = viewerId(req);
    const code = String(req.body.inviteCode || '').trim().toUpperCase();
    const row = await FamilyPairing.findOne({ inviteCode: code, status: 'pending', teen: null });
    if (!row) return res.status(404).json({ success: false, message: 'Invite code is invalid or expired.' });
    if (String(row.parent) === teenId) {
      return res.status(400).json({ success: false, message: 'You cannot pair an account with itself.' });
    }
    const existing = await FamilyPairing.findOne({ teen: teenId, status: 'active' }).lean();
    if (existing) return res.status(409).json({ success: false, message: 'This account is already paired.' });

    row.teen = teenId;
    row.status = 'active';
    row.pairedAt = new Date();
    await row.save();

    const parent = await User.findById(row.parent).select('name username profileImage verified').lean();
    return res.json({
      success: true,
      data: { id: String(row._id), status: row.status, parent: safeUser(parent), controls: row.controls },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Invite could not be accepted.' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const id = viewerId(req);
    const rows = await FamilyPairing.find({
      status: 'active',
      $or: [{ parent: id }, { teen: id }],
    })
      .populate('parent', 'name username profileImage verified')
      .populate('teen', 'name username profileImage verified')
      .lean();
    return res.json({
      success: true,
      data: rows.map((row) => ({
        id: String(row._id),
        role: String(row.parent?._id || row.parent) === id ? 'parent' : 'teen',
        parent: safeUser(row.parent),
        teen: safeUser(row.teen),
        controls: row.controls || {},
        pairedAt: row.pairedAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Family pairing status could not be loaded.' });
  }
};

exports.updateControls = async (req, res) => {
  try {
    const parentId = viewerId(req);
    const pairingId = String(req.params.id || '');
    const row = await FamilyPairing.findOne({ _id: pairingId, parent: parentId, status: 'active' });
    if (!row) return res.status(404).json({ success: false, message: 'Active family pairing not found.' });
    const next = req.body || {};
    if (typeof next.saferContentMode === 'boolean') row.controls.saferContentMode = next.saferContentMode;
    if (typeof next.allowDirectMessages === 'boolean') row.controls.allowDirectMessages = next.allowDirectMessages;
    if (typeof next.privateAccount === 'boolean') row.controls.privateAccount = next.privateAccount;
    if (Number.isFinite(Number(next.dailyScreenTimeMinutes))) {
      row.controls.dailyScreenTimeMinutes = Math.max(15, Math.min(1440, Math.floor(Number(next.dailyScreenTimeMinutes))));
    }
    await row.save();
    if (typeof next.privateAccount === 'boolean' && row.teen) {
      await User.updateOne({ _id: row.teen }, { $set: { isPrivate: next.privateAccount } });
    }
    return res.json({ success: true, data: { id: String(row._id), controls: row.controls } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Family controls could not be saved.' });
  }
};

exports.unlink = async (req, res) => {
  try {
    const id = viewerId(req);
    const pairingId = String(req.params.id || '');
    const row = await FamilyPairing.findOne({
      _id: pairingId,
      status: 'active',
      $or: [{ parent: id }, { teen: id }],
    });
    if (!row) return res.status(404).json({ success: false, message: 'Pairing not found.' });
    row.status = 'revoked';
    await row.save();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Family pairing could not be removed.' });
  }
};
