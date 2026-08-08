const crypto = require("crypto");

const token04 = (appID, userID, serverSecret, effectiveSeconds, payload = "") => {
  const now = Math.floor(Date.now() / 1000);
  const tokenInfo = {
    app_id: appID,
    user_id: userID,
    nonce: crypto.randomInt(-2147483648, 2147483647),
    ctime: now,
    expire: now + effectiveSeconds,
    payload,
  };
  const iv = crypto.randomBytes(8).toString("hex");
  const secret = Buffer.from(serverSecret, "utf8");
  const algorithm = `aes-${secret.length * 8}-cbc`;
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(tokenInfo), "utf8"),
    cipher.final(),
  ]);
  const expire = Buffer.alloc(8);
  expire.writeBigInt64BE(BigInt(tokenInfo.expire));
  const ivLength = Buffer.alloc(2);
  ivLength.writeUInt16BE(Buffer.byteLength(iv));
  const encryptedLength = Buffer.alloc(2);
  encryptedLength.writeUInt16BE(encrypted.length);
  return `04${Buffer.concat([expire, ivLength, Buffer.from(iv), encryptedLength, encrypted]).toString("base64")}`;
};

exports.createZegoToken = (req, res) => {
  const appID = Number(process.env.ZEGO_APP_ID);
  const serverSecret = process.env.ZEGO_SERVER_SECRET || "";
  const liveID = String(req.body.liveID || "").trim();
  if (!appID || !serverSecret) {
    return res.status(503).json({ success: false, message: "ZEGOCLOUD is not configured on the server." });
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(liveID)) {
    return res.status(400).json({ success: false, message: "Invalid live room ID." });
  }
  if (![16, 24, 32].includes(Buffer.byteLength(serverSecret))) {
    return res.status(500).json({ success: false, message: "Invalid ZEGOCLOUD server secret." });
  }
  try {
    const userID = String(req.user.id).replace(/[^A-Za-z0-9_]/g, "_");
    const payload = JSON.stringify({ room_id: liveID, privilege: { 1: 1, 2: 1 }, stream_id_list: null });
    const token = token04(appID, userID, serverSecret, 3600, payload);
    return res.json({ success: true, appID, userID, liveID, token, expiresIn: 3600 });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not create live token." });
  }
};
