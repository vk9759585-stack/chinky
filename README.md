# Chinky Backend

Production API for Chinky mobile/web clients.

Production website and API origin: `https://chinkyapp.com`

## Quick Start

1. Install dependencies: npm install
2. Create local env file: copy .env.example .env
3. Fill required values in .env: MONGO_URI and JWT_SECRET
4. Run in development: npm run dev

The same server also hosts the website from `website/`. After startup, open
`http://127.0.0.1:5000`; API routes remain available under `/api`, website
session routes under `/auth`, and website dashboard routes under `/web`.

## Scripts

- npm start: Start server in normal mode.
- npm run dev: Start server with nodemon.
- npm run check:syntax: Validate server entry syntax quickly.
- npm run smoke:health: Run only Health folder smoke checks.
- npm run smoke:full: Run full smoke suite (requires SMOKE_LOGIN and SMOKE_PASSWORD).

## Render Deployment

Use the deployment checklist before each deploy:

- [RENDER_DEPLOY_CHECKLIST.md](RENDER_DEPLOY_CHECKLIST.md)

## Smoke Tests (Postman)

Import these files in Postman:

- [smoke-tests/chinky-render-smoke.postman_collection.json](smoke-tests/chinky-render-smoke.postman_collection.json)
- [smoke-tests/chinky-render.postman_environment.json](smoke-tests/chinky-render.postman_environment.json)

Run order:

1. Health folder
2. Auth And Core folder
3. Optional Actions folder (after setting postId and targetUserId)

CLI automation:

1. Set env vars: SMOKE_BASE_URL, SMOKE_LOGIN, SMOKE_PASSWORD
2. Run health checks: npm run smoke:health
3. Run full checks: npm run smoke:full

CI workflow:

- [.github/workflows/backend-smoke-tests.yml](../.github/workflows/backend-smoke-tests.yml)
- Required GitHub repository secrets:
- SMOKE_BASE_URL example: `https://chinkyapp.com`
- SMOKE_LOGIN
- SMOKE_PASSWORD
- Optional: SMOKE_SEARCH_QUERY

## Health Endpoints

- GET /health: DB connectivity health.
- GET /health/config: Core env and integration status (non-secret booleans only).

## Notes

- Payment APIs degrade gracefully if Razorpay keys are absent (return 503 instead of crashing app startup).
- CORS in production is controlled by FRONTEND_ORIGINS (comma-separated).
- Website and backend deploy together; do not deploy `website/` as a separate service.
