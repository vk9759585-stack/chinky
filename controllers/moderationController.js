const cloudinary = require("../config/cloudinary");
const Post = require("../models/Post");
const Spark = require("../models/Spark");
const Vibes = require("../models/Vibes");
const Notification = require("../models/Notification");
const {
  moderationPayloadStatus,
  verifyWebhook,
} = require("../services/contentModerationService");

const notifyRemoval = async (userId, type) => {
  if (!userId) return;
  await Notification.create({
    receiver: userId,
    type: "support",
    title: "Content removed",
    body: `Your ${type} was automatically removed because the safety scan detected sexual or adult content.`,
  }).catch(() => {});
};

async function updateOrRemove(Model, publicField, publicId, status, type) {
  const item = await Model.findOne({ [publicField]: publicId });
  if (!item) return false;

  if (status === "approved") {
    item.moderationStatus = "approved";
    item.moderationCheckedAt = new Date();
    await item.save();
    return true;
  }

  if (status === "rejected") {
    const userId = item.user;
    await Model.deleteOne({ _id: item._id });
    await notifyRemoval(userId, type);
    return true;
  }

  if (status === "pending") {
    await Model.updateOne(
      { _id: item._id },
      { $set: { moderationStatus: "pending" } }
    );
    return true;
  }

  return false;
}

exports.cloudinaryModeration = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ success: false });
    }

    const body = req.body || {};
    const publicId = String(body.public_id || body.publicId || "").trim();
    const status = moderationPayloadStatus(body);
    const resourceType = String(body.resource_type || "image");

    if (!publicId || !["pending", "approved", "rejected"].includes(status)) {
      return res.json({ success: true, ignored: true });
    }

    const handled =
      await updateOrRemove(Post, "mediaPublicId", publicId, status, "Post") ||
      await updateOrRemove(Spark, "videoPublicId", publicId, status, "Spark") ||
      await updateOrRemove(Vibes, "mediaPublicId", publicId, status, "Vibe");

    if (status === "rejected") {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType === "video" ? "video" : "image",
        invalidate: true,
      }).catch(() => {});
    }

    return res.json({ success: true, handled, status });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
