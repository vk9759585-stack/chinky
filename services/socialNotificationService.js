const Notification = require("../models/Notification");

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

  try {
    const io = req?.app?.get("io");
    if (io) {
      const populated = await Notification.findById(notification._id)
        .populate("sender", "username name profileImage verified")
        .lean();
      io.to(receiver).emit("notification", populated);
    }
  } catch (_) {}
  return notification;
}

module.exports = { createSocialNotification };
