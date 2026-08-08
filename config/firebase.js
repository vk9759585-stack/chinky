const admin = require("firebase-admin");

// Firebase Admin is optional for core API startup. When push notifications are
// used, credentials can come from GOOGLE_APPLICATION_CREDENTIALS / ADC or from
// FIREBASE_SERVICE_ACCOUNT_JSON (a JSON string kept only on the server).
if (!admin.apps.length) {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}`);
    }
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

module.exports = admin;
