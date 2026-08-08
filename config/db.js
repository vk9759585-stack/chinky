const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  const dnsServers = process.env.DNS_SERVERS
    ?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  const mongoUri = process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    console.error("MONGO_URI is missing. Add it to the deployment environment.");
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
    return null;
  }
};

module.exports = connectDB;
