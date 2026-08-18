const crypto=require("crypto");const SocialFeature=require("../models/SocialFeature");const User=require("../models/User");const A=new Set(["story","close_friend","live_guest","live_queue","gift_combo","creator_subscription","private_live","spark_series","collab_post","auto_caption","translation","watch_history","save_collection","creator_goal","top_supporter","live_moderator","anti_spam_event","verification_request","profile_qr","local_trending"]);const uid=r=>r.user?.id||r.user?._id;exports.create=async(r,s)=>{try{const t=A.has(r.params.type)?r.params.type:null;if(!t)return s.status(400).json({success:false,message:"Unsupported feature"});const b=r.body||{};let e=b.expiresAt||null;if(t==="story"&&!e)e=new Date(Date.now()+86400000);const item=await SocialFeature.create({type:t,owner:uid(r),targetUser:b.targetUser||null,contentId:String(b.contentId||""),title:String(b.title||"").slice(0,120),text:String(b.text||"").slice(0,5000),mediaUrl:String(b.mediaUrl||""),data:b.data||{},visibility:b.visibility||(t==="close_friend"?"close_friends":"public"),status:t==="verification_request"?"pending":"active",expiresAt:e,country:String(b.country||"").slice(0,80),city:String(b.city||"").slice(0,80)});s.status(201).json({success:true,item});}catch(e){s.status(500).json({success:false,message:e.message});}};exports.list=async(r,s)=>{try{const t=A.has(r.params.type)?r.params.type:null;if(!t)return s.status(400).json({success:false,message:"Unsupported feature"});const q={type:t,status:{$in:["active","pending","approved"]}};if(r.query.mine==="1")q.owner=uid(r);if(t==="story")q.$or=[{expiresAt:null},{expiresAt:{$gt:new Date()}}];if(r.query.country)q.country=String(r.query.country);if(r.query.city)q.city=String(r.query.city);s.json({success:true,items:await SocialFeature.find(q).sort({createdAt:-1}).limit(100).lean()});}catch(e){s.status(500).json({success:false,message:e.message});}};exports.remove=async(r,s)=>{try{const x=await SocialFeature.findOneAndDelete({_id:r.params.id,owner:uid(r)});if(!x)return s.status(404).json({success:false,message:"Not found"});s.json({success:true});}catch(e){s.status(500).json({success:false,message:e.message});}};exports.profileQr=async(r,s)=>{try{const u=await User.findById(uid(r)).select("username").lean();if(!u)return s.status(404).json({success:false,message:"User not found"});const p=`chinky://profile/${u.username}`,h=crypto.createHash("sha256").update(p).digest("hex").slice(0,16);s.json({success:true,payload:p,shareCode:`${p}?s=${h}`});}catch(e){s.status(500).json({success:false,message:e.message});}};exports.localTrending=async(r,s)=>{try{const q={type:"local_trending",status:"active"};if(r.query.country)q.country=String(r.query.country);if(r.query.city)q.city=String(r.query.city);s.json({success:true,items:await SocialFeature.find(q).sort({"data.score":-1,createdAt:-1}).limit(50).lean()});}catch(e){s.status(500).json({success:false,message:e.message});}};

exports.closeFriends = async (req, res) => {
  try {
    const owner = uid(req);
    const items = await SocialFeature.find({
      type: "close_friend",
      owner,
      status: "active",
      targetUser: { $ne: null },
    })
      .populate("targetUser", "name username profileImage verified")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      items: items.map((item) => ({
        id: String(item._id),
        user: item.targetUser,
        createdAt: item.createdAt,
      })),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.addCloseFriend = async (req, res) => {
  try {
    const owner = uid(req);
    const username = String(req.body.username || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const target = await User.findOne({ username })
      .select("_id name username profileImage verified")
      .lean();

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (String(target._id) === String(owner)) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself to Close Friends",
      });
    }

    const item = await SocialFeature.findOneAndUpdate(
      {
        type: "close_friend",
        owner,
        targetUser: target._id,
      },
      {
        $set: {
          status: "active",
          visibility: "close_friends",
          title: `@${target.username}`,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      item: {
        id: String(item._id),
        user: target,
        createdAt: item.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.removeCloseFriend = async (req, res) => {
  try {
    const removed = await SocialFeature.findOneAndDelete({
      _id: req.params.id,
      type: "close_friend",
      owner: uid(req),
    });
    if (!removed) {
      return res.status(404).json({ success: false, message: "Close Friend not found" });
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
