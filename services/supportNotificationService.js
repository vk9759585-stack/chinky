const Notification = require("../models/Notification");
const User = require("../models/User");

async function notifyUser(app, { receiver, title, body, ticket }) {
  if (!receiver) return null;
  const receiverId = receiver.toString();
  const notification = await Notification.create({
    receiver: receiverId,
    type: "support",
    title: title || "CHINKY Support",
    body: body || "Your support ticket was updated.",
    link: ticket ? `/support/tickets/${ticket._id || ticket}` : "/support",
    isRead: false
  });

  try {
    const io = app?.get?.("io");
    if (io) {
      const payload = notification.toObject();
      io.to(`user:${receiverId}`).emit("notification", payload);
      io.to(`user:${receiverId}`).emit("support:updated", {
        ticketId: String(ticket?._id || ticket || ""),
        notification: payload
      });
    }
  } catch (_) {}
  return notification;
}

async function notifyAdmins(app, { title, body, ticket, excludeUser = null }) {
  const admins = await User.find({ role: "admin", banned: { $ne: true } }).select("_id").lean();
  const excluded = excludeUser ? excludeUser.toString() : "";
  return Promise.allSettled(admins
    .filter((admin) => admin._id.toString() !== excluded)
    .map((admin) => notifyUser(app, {
      receiver: admin._id,
      title,
      body,
      ticket
    })));
}

module.exports = { notifyUser, notifyAdmins };
