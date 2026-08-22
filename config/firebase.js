const {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} = require("firebase-admin/app");

const path = require("path");
const fs = require("fs");

function normalizedPrivateKey(value) {
  return String(value || "").replace(/\\n/g, "\n");
}

function serviceAccountFromEnv() {
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
    }
  }

  const filePath = String(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "").trim();
  if (filePath && fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_PATH file:", error.message);
    }
  }

  const candidates = [
    path.join(__dirname, "..", "firebase-service-account.json"),
    path.join(__dirname, "..", "serviceAccountKey.json"),
    path.join(__dirname, "..", "firebase-admin.json"),
    path.join(__dirname, "..", "..", "firebase-service-account.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, "utf8"));
      } catch (_) {}
    }
  }

  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = normalizedPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }
  return null;
}

function getFirebaseApp() {
  const existing = getApps();
  if (existing.length) return existing[0];

  const serviceAccount = serviceAccountFromEnv();
  if (serviceAccount) {
    return initializeApp({ credential: cert(serviceAccount) });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault() });
  }

  return null;
}

module.exports = { getFirebaseApp };
