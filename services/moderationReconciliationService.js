const cloudinary = require("../config/cloudinary");
const Post = require("../models/Post");
const Spark = require("../models/Spark");
const Vibes = require("../models/Vibes");
const Notification = require("../models/Notification");

const INTERVAL_MS = Math.max(
  30_000,
  Number(process.env.CHINKY_MODERATION_RECHECK_MS || 60_000)
);
const BATCH = Math.min(
  50,
  Math.max(5, Number(process.env.CHINKY_MODERATION_RECHECK_BATCH || 20))
);

let timer = null;
let running = false;

const statusFromResource = (resource) => {
  const moderation = Array.isArray(resource?.moderation)
    ? resource.moderation[0]
    : resource?.moderation;
  return String(
    moderation?.status ||
    resource?.moderation_status ||
    ""
  ).toLowerCase();
};

const notifyRemoval = async (userId, type) => {
  if (!userId) return;
  await Notification.create({
    receiver: userId,
    type: "support",
    title: "Content removed",
    body: `Your ${type} was automatically removed because the safety scan detected sexual or adult content.`,
  }).catch(() => {});
};

async function reconcileModel({
  Model,
  publicField,
  resourceType,
  type,
  extraReadyFilter = {},
}) {
  const items = await Model.find({
    moderationStatus: "pending",
    [publicField]: { $exists: true, $ne: "" },
    ...extraReadyFilter,
  })
    .select(`_id user ${publicField} moderationStatus`)
    .sort({ createdAt: 1 })
    .limit(BATCH)
    .lean();

  for (const item of items) {
    const publicId = String(item[publicField] || "").trim();
    if (!publicId) continue;

    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      const status = statusFromResource(resource);

      if (status === "approved") {
        await Model.updateOne(
          { _id: item._id, moderationStatus: "pending" },
          {
            $set: {
              moderationStatus: "approved",
              moderationCheckedAt: new Date(),
            },
          }
        );
        continue;
      }

      if (status === "rejected") {
        await Model.deleteOne({ _id: item._id });
        await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        }).catch(() => {});
        await notifyRemoval(item.user, type);
      }
    } catch (_) {
      // Keep pending and retry on a later pass. A temporary Cloudinary/API
      // problem must never delete a user's safe upload.
    }
  }
}

async function reconcilePendingModeration() {
  if (running) return;
  running = true;
  try {
    await reconcileModel({
      Model: Post,
      publicField: "mediaPublicId",
      resourceType: "image",
      type: "Post",
      extraReadyFilter: { mediaType: { $ne: "video" } },
    });

    // Some posts are videos. Re-run only those that did not resolve above.
    const videoPosts = await Post.find({
      moderationStatus: "pending",
      mediaType: "video",
      mediaPublicId: { $exists: true, $ne: "" },
    })
      .select("_id user mediaPublicId")
      .sort({ createdAt: 1 })
      .limit(BATCH)
      .lean();

    for (const item of videoPosts) {
      try {
        const resource = await cloudinary.api.resource(item.mediaPublicId, {
          resource_type: "video",
        });
        const status = statusFromResource(resource);
        if (status === "approved") {
          await Post.updateOne(
            { _id: item._id, moderationStatus: "pending" },
            {
              $set: {
                moderationStatus: "approved",
                moderationCheckedAt: new Date(),
              },
            }
          );
        } else if (status === "rejected") {
          await Post.deleteOne({ _id: item._id });
          await cloudinary.uploader.destroy(item.mediaPublicId, {
            resource_type: "video",
            invalidate: true,
          }).catch(() => {});
          await notifyRemoval(item.user, "Post");
        }
      } catch (_) {}
    }

    await reconcileModel({
      Model: Spark,
      publicField: "videoPublicId",
      resourceType: "video",
      type: "Spark",
      extraReadyFilter: {
        $or: [
          { publishStatus: { $exists: false } },
          { publishStatus: "ready" },
        ],
      },
    });

    const vibes = await Vibes.find({
      moderationStatus: "pending",
      mediaPublicId: { $exists: true, $ne: "" },
    })
      .select("_id user mediaPublicId isVideo")
      .sort({ createdAt: 1 })
      .limit(BATCH)
      .lean();

    for (const item of vibes) {
      try {
        const resourceType = item.isVideo ? "video" : "image";
        const resource = await cloudinary.api.resource(item.mediaPublicId, {
          resource_type: resourceType,
        });
        const status = statusFromResource(resource);
        if (status === "approved") {
          await Vibes.updateOne(
            { _id: item._id, moderationStatus: "pending" },
            {
              $set: {
                moderationStatus: "approved",
                moderationCheckedAt: new Date(),
              },
            }
          );
        } else if (status === "rejected") {
          await Vibes.deleteOne({ _id: item._id });
          await cloudinary.uploader.destroy(item.mediaPublicId, {
            resource_type: resourceType,
            invalidate: true,
          }).catch(() => {});
          await notifyRemoval(item.user, "Vibe");
        }
      } catch (_) {}
    }
  } finally {
    running = false;
  }
}

function startModerationReconciliation() {
  if (timer) return;
  setTimeout(() => {
    reconcilePendingModeration().catch(() => {});
  }, 8_000).unref?.();

  timer = setInterval(() => {
    reconcilePendingModeration().catch(() => {});
  }, INTERVAL_MS);
  timer.unref?.();
}

module.exports = {
  startModerationReconciliation,
  reconcilePendingModeration,
};
