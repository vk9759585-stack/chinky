// Adult/sexual-content auto moderation is temporarily disabled.
// Keep this compatibility shim so existing upload controllers do not need
// risky changes. Re-enable moderation later by replacing this service.
const enabled = false;

function uploadOptions() {
  return {};
}

function moderationStatus() {
  return "approved";
}

function isRejected() {
  return false;
}

function isApproved() {
  return true;
}

function verifyWebhook() {
  return false;
}

function moderationPayloadStatus() {
  return "";
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
