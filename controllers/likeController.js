const mongoose = require("mongoose");
const Post = require("../models/Post");

function viewerIdFromRequest(req) {
  const raw = req.user?.id || req.user?._id || req.user?.userId;
  return raw ? raw.toString() : "";
}

exports.likePost = async (req, res) => {
  try {
    const userId = viewerIdFromRequest(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: "Invalid authenticated user" });
    }

    const postId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "Invalid post id" });
    }

    const existing = await Post.findById(postId).select("likes");
    if (!existing) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const currentlyLiked = existing.likes.some((id) => id.toString() === userId);
    const desired = typeof req.body?.liked === "boolean" ? req.body.liked : !currentlyLiked;

    const update = desired
      ? { $addToSet: { likes: userId } }
      : { $pull: { likes: userId } };

    const post = await Post.findByIdAndUpdate(postId, update, { new: true })
      .select("likes")
      .lean();

    const liked = Array.isArray(post?.likes) && post.likes.some((id) => id.toString() === userId);
    const likes = Array.isArray(post?.likes) ? post.likes.length : 0;

    return res.status(200).json({
      success: true,
      liked,
      likes,
      totalLikes: likes
    });
  } catch (err) {
    console.error("Like post error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .select("likes")
      .populate("likes", "name username profileImage verified");

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const users = (post.likes || []).map((user) => ({
      _id: user._id,
      id: user._id,
      name: user.name || "",
      username: user.username || "",
      profileImage: user.profileImage || "",
      verified: user.verified === true
    }));

    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error("Get post likes error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
