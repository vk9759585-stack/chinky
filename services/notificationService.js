const { getMessaging } = require("firebase-admin/messaging");
const { getFirebaseApp } = require("../config/firebase");

function stringData(data = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );
}

exports.sendNotification = async (tokens, title, body, data = {}, options = {}) => {
  const list = [
    ...new Set(
      (Array.isArray(tokens) ? tokens : [tokens])
        .map((token) => String(token || "").trim())
        .filter(Boolean)
    ),
  ].slice(0, 500);

  if (!list.length) return { sent: 0, failed: 0, invalidTokens: [] };

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    console.warn("FCM skipped: Firebase Admin credentials are not configured.");
    return { sent: 0, failed: 0, invalidTokens: [], skipped: true };
  }

  try {
    const response = await getMessaging(firebaseApp).sendEachForMulticast({
      tokens: list,
      notification: {
        title: String(title || "CHINKY"),
        body: String(body || "New activity"),
      },
      data: stringData(data),
      android: {
        priority: "high",
        ttl: Number.isFinite(Number(options.ttlMs))
          ? Number(options.ttlMs)
          : 60 * 60 * 1000,
        notification: {
          channelId: options.channelId || "chinky_social",
          sound: options.sound === false ? undefined : "default",
          priority: "max",
          visibility: "public",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: options.sound === false ? undefined : "default",
            badge: 1,
          },
        },
      },
    });

    const invalidTokens = [];
    response.responses.forEach((item, index) => {
      if (item.success) return;
      const code = item.error?.code || "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        invalidTokens.push(list[index]);
      }
    });

    return {
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error("FCM send failed:", error.message);
    return {
      sent: 0,
      failed: list.length,
      invalidTokens: [],
      error: error.message,
    };
  }
};
