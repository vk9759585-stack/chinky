# Render Deploy Checklist

Use this before every production deploy.

## 1. Build and Start Settings

- Root Directory: backend
- Build Command: npm install
- Start Command: npm start
- Node Version: keep consistent with local tested version (recommended LTS)

## 2. Required Environment Variables

Set these in Render service environment:

- NODE_ENV=production
- PORT=10000 (Render sets this automatically, keep code fallback intact)
- MONGO_URI=your_mongo_connection_string
- JWT_SECRET=your_strong_random_secret
- FRONTEND_ORIGINS=`https://your-frontend-domain.com,https://www.your-frontend-domain.com`

## 3. Optional Integrations (Set only if feature is used)

- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- RAZORPAY_KEY
- RAZORPAY_SECRET
- ZEGO_APP_ID
- ZEGO_SERVER_SECRET
- REDIS_URL
- FIREBASE_SERVICE_ACCOUNT_JSON
- EMAIL
- EMAIL_PASSWORD
- MSG91_AUTH_KEY
- MSG91_TEMPLATE_ID
- JWT_EXPIRES_IN
- DNS_SERVERS

## 4. Post-Deploy Smoke Checks

Run these checks after deploy:

1. GET / should return API metadata JSON.
2. GET /health should return 200 when DB is connected.
3. GET /health/config should show core booleans true:
   - MONGO_URI
   - JWT_SECRET
   - dbConnected
4. Login flow works.
5. Feed endpoint works.
6. Follow and like actions work.
7. Payment endpoints return:
   - normal responses when Razorpay is configured
   - 503 when Razorpay is intentionally not configured

## 5. Rollback Triggers

Rollback immediately if any of these occur:

- /health stays 503 for more than 2 minutes
- login or token verification fails globally
- profile/content endpoints fail at high rate
- socket connection fails for most users

## 6. Security Checks

- Do not commit real .env to git.
- Keep JWT_SECRET and API keys only in Render secrets.
- Keep ZEGO_SERVER_SECRET and FIREBASE_SERVICE_ACCOUNT_JSON backend-only.
- Restrict FRONTEND_ORIGINS to known trusted domains.
