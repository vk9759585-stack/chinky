# Multi-server production setup

Use a load balancer in front of at least three API instances, a managed MongoDB
replica set, and managed Redis. Every API instance must use the same values for
`MONGO_URI`, `JWT_SECRET`, Cloudinary settings, and `REDIS_URL`.

Configure the platform health check to call `GET /` and enable WebSocket
connections. Redis is required before Socket.IO can share real-time events
between multiple server instances.

Do not run multiple API copies against local uploads. Media must remain in
Cloudinary/object storage so every instance can serve the same posts and vibes.
