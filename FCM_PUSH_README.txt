CHINKY BACKEND FCM PUSH
=======================
MongoDB remains the database. Firebase Admin is used only to send push notifications.

Render secrets required:
Option A:
  FIREBASE_SERVICE_ACCOUNT_JSON=<complete service-account JSON>
Option B:
  FIREBASE_PROJECT_ID=<project id>
  FIREBASE_CLIENT_EMAIL=<service-account email>
  FIREBASE_PRIVATE_KEY=<private key; escaped \\n is accepted>

Endpoints added:
  POST /api/notifications/device-token
  POST /api/notifications/device-token/remove
Both require the existing Bearer auth token.

FCM is best-effort: if credentials are missing or FCM temporarily fails, Like/Comment/Follow still completes and the MongoDB/in-app notification remains saved.
Invalid/expired FCM tokens are removed automatically.
