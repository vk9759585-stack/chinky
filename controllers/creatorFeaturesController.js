const mongoose = require("mongoose");
const Post = require("../models/Post");
const Spark = require("../models/Spark");
const LiveSession = require("../models/LiveSession");
const Gift = require("../models/Gift");
const Follow = require("../models/Follow");
const Wallet = require("../models/Wallet");
const ScheduledLive = require("../models/ScheduledLive");
const LiveBattle = require("../models/LiveBattle");
const CreatorToolsProfile = require("../models/CreatorToolsProfile");

const validId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const cleanWords = (raw) => Array.from(new Set((Array.isArray(raw) ? raw : String(raw || "").split(","))
  .map((v) => String(v).trim().toLowerCase()).filter(Boolean))).slice(0, 100);

async function profile(userId) {
  return CreatorToolsProfile.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true }
  );
}

exports.analytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const [postCount, sparkCount, lives, followers, wallet, gifts, p] = await Promise.all([
      Post.countDocuments({ user: userId, isArchived: { $ne: true } }),
      Spark.countDocuments({ user: userId }),
      LiveSession.countDocuments({ hostUserId: userId }),
      Follow.countDocuments({ following: userId }),
      Wallet.findOne({ user: userId }).lean(),
      Gift.aggregate([
        { $match: { receiver: new mongoose.Types.ObjectId(userId), status: "completed" } },
        { $group: { _id: null, count: { $sum: 1 }, coins: { $sum: "$coins" } } }
      ]),
      profile(userId)
    ]);
    const [postViews, sparkViews] = await Promise.all([
      Post.aggregate([{ $match: { user: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: null, views: { $sum: "$views" } } }]),
      Spark.aggregate([{ $match: { user: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: null, views: { $sum: "$views" } } }])
    ]);
    const views = (postViews[0]?.views || 0) + (sparkViews[0]?.views || 0);
    const xp = Math.max(p.xp || 0, Math.floor(views / 10) + followers * 5 + (gifts[0]?.count || 0) * 3);
    const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
    if (xp !== p.xp || level !== p.level) { p.xp = xp; p.level = level; await p.save(); }
    res.json({ success: true, data: {
      posts: postCount, sparks: sparkCount, lives, followers, views,
      gifts: gifts[0]?.count || 0, giftCoins: gifts[0]?.coins || 0,
      earningsPaise: wallet?.availableEarningsPaise || 0,
      level, xp, nextLevelXp: level * level * 100
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.scheduleLive = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const when = new Date(req.body.scheduledFor);
    if (!title || Number.isNaN(when.getTime()) || when <= new Date()) return res.status(400).json({ success:false, message:"Future date/time and title are required" });
    const item = await ScheduledLive.create({ host:req.user.id, title, scheduledFor:when });
    res.status(201).json({ success:true, data:item });
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.listScheduled = async (req,res) => {
  const data = await ScheduledLive.find({host:req.user.id,status:"scheduled",scheduledFor:{$gte:new Date()}}).sort({scheduledFor:1}).lean();
  res.json({success:true,data});
};

exports.inviteGuest = async (req,res) => {
  try {
    const liveID=String(req.body.liveID||"").trim(), guestUserId=String(req.body.guestUserId||"").trim();
    if(!liveID || !validId(guestUserId)) return res.status(400).json({success:false,message:"Valid liveID and guestUserId required"});
    const live=await LiveSession.findOneAndUpdate({liveID,hostUserId:req.user.id,isLive:true},{guestUserId,guestStatus:"invited"},{new:true});
    if(!live) return res.status(404).json({success:false,message:"Active live not found"});
    req.app.get("io")?.to(`user:${guestUserId}`).emit("live:guest-invite",{liveID,hostUserId:req.user.id});
    res.json({success:true,data:live});
  }catch(e){res.status(500).json({success:false,message:e.message});}
};

exports.startBattle = async (req,res) => {
  try {
    const opponent=String(req.body.opponentUserId||"").trim();
    if(!validId(opponent) || opponent===String(req.user.id)) return res.status(400).json({success:false,message:"Valid opponent required"});
    const battle=await LiveBattle.create({host:req.user.id,opponent,liveID:String(req.body.liveID||"").trim()});
    req.app.get("io")?.to(`user:${opponent}`).emit("live:battle-invite",battle.toObject());
    res.status(201).json({success:true,data:battle});
  }catch(e){res.status(500).json({success:false,message:e.message});}
};
exports.battleAction = async (req,res) => {
  try {
    const battle=await LiveBattle.findById(req.params.id);
    if(!battle) return res.status(404).json({success:false,message:"Battle not found"});
    const me=String(req.user.id), host=String(battle.host), opponent=String(battle.opponent);
    if(me!==host && me!==opponent) return res.status(403).json({success:false,message:"Not a participant"});
    const action=String(req.body.action||"");
    if(action==="accept" && me===opponent){battle.status="active";battle.startedAt=new Date();}
    else if(action==="reject" && me===opponent){battle.status="rejected";battle.endedAt=new Date();}
    else if(action==="end"){battle.status="ended";battle.endedAt=new Date();}
    else if(action==="score"){
      const points=Math.max(0,Math.min(100000,Number(req.body.points)||0));
      if(me===host) battle.hostScore+=points; else battle.opponentScore+=points;
    } else return res.status(400).json({success:false,message:"Invalid action"});
    await battle.save();
    res.json({success:true,data:battle});
  }catch(e){res.status(500).json({success:false,message:e.message});}
};

exports.remixInfo = async (req,res) => {
  const spark=validId(req.params.id)?await Spark.findById(req.params.id).select("video thumbnail caption user").lean():null;
  if(!spark) return res.status(404).json({success:false,message:"Spark not found"});
  res.json({success:true,data:spark});
};

exports.getSafety = async (req,res) => { const p=await profile(req.user.id); res.json({success:true,data:{bannedWords:p.bannedWords,mutedWords:p.mutedWords}}); };
exports.saveSafety = async (req,res) => {
  const p=await profile(req.user.id); p.bannedWords=cleanWords(req.body.bannedWords); p.mutedWords=cleanWords(req.body.mutedWords); await p.save();
  res.json({success:true,data:{bannedWords:p.bannedWords,mutedWords:p.mutedWords}});
};
exports.listDrafts = async (req,res) => { const p=await profile(req.user.id); res.json({success:true,data:p.drafts.sort((a,b)=>b.updatedAt-a.updatedAt)}); };
exports.saveDraft = async (req,res) => {
  const p=await profile(req.user.id); p.drafts.unshift({kind:["post","spark","vibes"].includes(req.body.kind)?req.body.kind:"spark",caption:String(req.body.caption||"").slice(0,500),localPath:String(req.body.localPath||"").slice(0,1200),sourceId:String(req.body.sourceId||"").slice(0,120),updatedAt:new Date()});
  p.drafts=p.drafts.slice(0,50); await p.save(); res.status(201).json({success:true,data:p.drafts[0]});
};
exports.deleteDraft = async (req,res) => {
  const p=await profile(req.user.id); p.drafts=p.drafts.filter(d=>String(d._id)!==String(req.params.id)); await p.save(); res.json({success:true});
};
