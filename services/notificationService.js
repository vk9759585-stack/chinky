const admin = require("../config/firebase");

// Send push notification via Firebase
exports.sendNotification = async (token, title, body, data = {}) => {
  try {
    // Basic validation
    if (!token) throw new Error("FCM token is required");
    if (!title) throw new Error("Notification title is required");
    if (!body) throw new Error("Notification body is required");

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data, // optional custom data payload (must be string values)
    };

    const response = await admin.messaging().send(message);

    console.log("Notification sent successfully:", response);
    return response;

  } catch (error) {
    console.error("Error sending notification:", error.message);
    throw new Error("Failed to send notification");
  }
};