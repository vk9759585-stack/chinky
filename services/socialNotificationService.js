const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendNotification } = require("./notificationService");

function preferenceKey(type) {
  if (["like", "spark_like", "vibes_like"].includes(type)) return "settings_notify_likes";
  if (["comment", "mention"].includes(type)) return "settings_notify_comments";
  if (type === "follow") return "settings_notify_followers";
  if (["message", "call"].includes(type)) return "settings_notify_messages";
  if (type === "live") return "settings_notify_live";
  if (["verification", "support"].includes(type)) return "settings_notify_security";
  return null;
}

function allowsPush(user, type) {
  const settings = user?.appSettings || {};
  if (settings.settings_notifications === false || settings.settings_quiet_mode === true) return false;
  const key = preferenceKey(type);
  return !key || settings[key] !== false;
}

async function createSocialNotification(req, payload) {
  const sender = payload.sender ? payload.sender.toString() : null;
  const receiver = payload.receiver ? payload.receiver.toString() : null;
  if (!receiver || (sender && sender === receiver)) return null;

  const notification = await Notification.create({
    sender: sender || null,
    receiver,
    type: payload.type || "mention",
    title: payload.title || "CHINKY",
    body: payload.body || "",
    image: payload.image || "",
    link: payload.link || "",
    isRead: false
  });

  let populated = null;
  try {
    populated = await Notification.findById(notification._id)
      .populate("sender", "username name profileImage verified")
      .lean();

    const io = req?.app?.get("io");
    if (io && populated) {
      io.to(receiver).emit("notification", populated);
    }
  } catch (error) {
    console.error("Realtime notification emit failed:", error.message);
  }

  // Push delivery is intentionally best-effort so a temporary FCM problem never
  // makes Like/Comment/Follow itself fail.
  try {
    const user = await User.findById(receiver).select("+fcmTokens appSettings").lean();
    const tokens = Array.isArray(user?.fcmTokens) ? user.fcmTokens : [];
    if (tokens.length && allowsPush(user, payload.type || "mention")) {
      const actor = populated?.sender;
      const actorName = actor?.username
        ? `@${actor.username}`
        : actor?.name || payload.title || "CHINKY";

      const settings = user.appSettings || {};
      const previewBody = settings.settings_notify_preview === false
        ? "Open CHINKY to view this notification."
        : payload.body || "New activity";
      const result = await sendNotification(tokens, actorName, previewBody, {
        type: payload.type || "activity",
        notificationId: notification._id.toString(),
        senderId: sender || "",
        link: payload.link || "",
        title: payload.title || "CHINKY",
        body: payload.body || "",
      }, { sound: settings.settings_notify_sound !== false });

      if (result.invalidTokens?.length) {
        await User.updateOne(
          { _id: receiver },
          { $pull: { fcmTokens: { $in: result.invalidTokens } } }
        );
      }
    }
  } catch (error) {
    console.error("Push notification delivery failed:", error.message);
  }

  return notification;
}

module.exports = { createSocialNotification };
