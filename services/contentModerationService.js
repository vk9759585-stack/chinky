const crypto = require("crypto");

const enabled = String(
  process.env.CHINKY_CONTENT_MODERATION || "on"
).toLowerCase() !== "off";

const publicBaseUrl = String(
  process.env.CHINKY_PUBLIC_API_URL ||
  process.env.PUBLIC_BASE_URL ||
  "https://chinkyapp.com"
).replace(/\/+$/, "");

const webhookToken = String(
  process.env.CHINKY_MODERATION_WEBHOOK_TOKEN || ""
).trim();

const imageModeration = String(
  process.env.CHINKY_IMAGE_MODERATION ||
  "aws_rek:explicit_nudity:0.65:suggestive:0.82"
).trim();

const videoModeration = String(
  process.env.CHINKY_VIDEO_MODERATION ||
  "aws_rek_video:explicit_nudity:0.65:suggestive:0.82"
).trim();

function notificationUrl() {
  if (!enabled) return undefined;
  const base = `${publicBaseUrl}/api/moderation/cloudinary`;
  return webhookToken
    ? `${base}?token=${encodeURIComponent(webhookToken)}`
    : base;
}

function uploadOptions(resourceType) {
  if (!enabled) return {};
  return {
    moderation: resourceType === "video"
      ? videoModeration
      : imageModeration,
    notification_url: notificationUrl(),
  };
}

function moderationStatus(upload) {
  if (!enabled) return "approved";
  const moderation = Array.isArray(upload?.moderation)
    ? upload.moderation[0]
    : upload?.moderation;
  return String(
    moderation?.status ||
    upload?.moderation_status ||
    "pending"
  ).toLowerCase();
}

function isRejected(upload) {
  return moderationStatus(upload) === "rejected";
}

function isApproved(upload) {
  return moderationStatus(upload) === "approved";
}

function verifyWebhook(req) {
  if (!webhookToken) return true;
  const supplied = String(req.query?.token || "");
  if (!supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(webhookToken);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function moderationPayloadStatus(body) {
  const first = Array.isArray(body?.moderation)
    ? body.moderation[0]
    : body?.moderation;
  return String(
    body?.moderation_status ||
    first?.status ||
    body?.status ||
    ""
  ).toLowerCase();
}

module.exports = {
  enabled,
  uploadOptions,
  moderationStatus,
  moderationPayloadStatus,
  isRejected,
  isApproved,
  verifyWebhook,
};
