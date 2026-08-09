const mongoose = require("mongoose");
const User = require("../models/User");
const { createSocialNotification } = require("../services/socialNotificationService");

const publicUserFields = "name username profileImage verified";

function viewerIdFromRequest(req) {
  const raw = req.user?.id || req.user?._id || req.user?.userId;
  return raw ? raw.toString() : "";
}

async function relationshipPayload(myId, targetId) {
  const [me, target] = await Promise.all([
    User.findById(myId).select("following").lean(),
    User.findById(targetId).select("followers").lean()
  ]);
  const isFollowing = Array.isArray(me?.following) && me.following.some((id) => id.toString() === targetId);
  return {
    isFollowing,
    followers: Array.isArray(target?.followers) ? target.followers.length : 0,
    following: Array.isArray(me?.following) ? me.following.length : 0
  };
}

exports.followUser = async (req, res) => {
  try {
    const myId = viewerIdFromRequest(req);
    const userId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(myId)) {
      return res.status(401).json({ success: false, message: "Invalid authenticated user" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    if (myId === userId) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    const target = await User.exists({ _id: userId });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    await Promise.all([
      User.updateOne({ _id: myId }, { $addToSet: { following: userId } }),
      User.updateOne({ _id: userId }, { $addToSet: { followers: myId } })
    ]);

    const relation = await relationshipPayload(myId, userId);
    await createSocialNotification(req, {
      sender: myId,
      receiver: userId,
      type: "follow",
      title: "New follower",
      body: "started following you",
      link: `/profile/${myId}`
    }).catch(() => {});
    return res.status(200).json({ success: true, message: "User followed successfully", ...relation });
  } catch (err) {
    console.error("Follow user error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const myId = viewerIdFromRequest(req);
    const userId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(myId)) {
      return res.status(401).json({ success: false, message: "Invalid authenticated user" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    if (myId === userId) {
      return res.status(400).json({ success: false, message: "You cannot unfollow yourself" });
    }

    const target = await User.exists({ _id: userId });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    await Promise.all([
      User.updateOne({ _id: myId }, { $pull: { following: userId } }),
      User.updateOne({ _id: userId }, { $pull: { followers: myId } })
    ]);

    const relation = await relationshipPayload(myId, userId);
    return res.status(200).json({ success: true, message: "User unfollowed successfully", ...relation });
  } catch (err) {
    console.error("Unfollow user error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const viewerId = viewerIdFromRequest(req);
    const [user, viewer] = await Promise.all([
      User.findById(req.params.id).populate("followers", publicUserFields).select("followers"),
      User.findById(viewerId).select("following")
    ]);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const followingIds = new Set((viewer?.following || []).map((id) => id.toString()));
    const data = user.followers.map((item) => ({
      ...item.toObject(),
      isFollowing: followingIds.has(item._id.toString()),
      isSelf: item._id.toString() === viewerId
    }));
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const viewerId = viewerIdFromRequest(req);
    const [user, viewer] = await Promise.all([
      User.findById(req.params.id).populate("following", publicUserFields).select("following"),
      User.findById(viewerId).select("following")
    ]);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const followingIds = new Set((viewer?.following || []).map((id) => id.toString()));
    const data = user.following.map((item) => ({
      ...item.toObject(),
      isFollowing: followingIds.has(item._id.toString()),
      isSelf: item._id.toString() === viewerId
    }));
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
