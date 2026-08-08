const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

let initialized = false;

async function configureRedisAdapter(io) {
  if (!process.env.REDIS_URL || initialized) return;

  const publisher = createClient({ url: process.env.REDIS_URL });
  const subscriber = publisher.duplicate();

  publisher.on("error", (error) =>
    console.error("Redis publisher error:", error.message),
  );
  subscriber.on("error", (error) =>
    console.error("Redis subscriber error:", error.message),
  );

  await Promise.all([publisher.connect(), subscriber.connect()]);
  io.adapter(createAdapter(publisher, subscriber));
  initialized = true;
  console.log("Socket.IO Redis adapter connected");
}

module.exports = configureRedisAdapter;
