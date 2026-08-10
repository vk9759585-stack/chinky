const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

// DB Connection (separate file recommended)
const connectDB = require("./config/db");

// Initialize app
const app = express();
const websiteRoot = path.resolve(__dirname, "..", "website");

const isNonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Non-browser/server-to-server requests may not include origin.
    if (!origin) return callback(null, true);

    if (!isProd || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin is not allowed"));
  },
};

const coreEnv = {
  MONGO_URI: isNonEmpty(process.env.MONGO_URI),
  JWT_SECRET: isNonEmpty(process.env.JWT_SECRET),
};

const optionalIntegrations = {
  CLOUDINARY: [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ].every(isNonEmpty),
  RAZORPAY: [process.env.RAZORPAY_KEY, process.env.RAZORPAY_SECRET].every(isNonEmpty),
  ZEGO: [process.env.ZEGO_APP_ID, process.env.ZEGO_SERVER_SECRET].every(isNonEmpty),
  REDIS: isNonEmpty(process.env.REDIS_URL),
  FIREBASE: isNonEmpty(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
};

const missingCore = Object.entries(coreEnv)
  .filter(([, enabled]) => !enabled)
  .map(([name]) => name);

if (missingCore.length) {
  console.warn(`Missing required env keys: ${missingCore.join(", ")}`);
}

// =====================
// MIDDLEWARE
// =====================
app.disable("x-powered-by");
if (isProd) app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; media-src 'self' https: blob:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'");
  if (isProd) res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
app.use(cors({
  ...corsOptions,
}));
app.use(express.json());

// Authenticated social state must never be served from a stale proxy cache.
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
});
app.use(express.urlencoded({ extended: true }));

// Uploaded media always resolves from the backend directory, regardless of
// whether the process is launched from the repository root or /backend.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================
// DATABASE
// =====================
connectDB();

// =====================
// ROUTES
// =====================

// Website authentication and dashboard routes use the same database and
// controllers as the mobile API. No second proxy/server is involved.
app.use(require("./routes/webRoutes"));

// Media
app.use("/api/media", require("./routes/mediaRoutes"));

// AUTH
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/otp", require("./routes/otpRoutes"));
app.use("/api/reset-password", require("./routes/resetPasswordRoutes"));

// FLOW
app.use("/api/flow", require("./routes/postRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/likes", require("./routes/likeRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));

// FOLLOW + SEARCH
app.use("/api/follow", require("./routes/followRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));

// VIBES
app.use("/api/vibes", require("./routes/vibesRoutes"));
app.use("/api/vibes-seen", require("./routes/vibesSeenRoutes"));

// LIVE STREAMING (ZEGOCLOUD room tokens)
app.use("/api/live", require("./routes/liveRoutes"));
app.use("/api/app", require("./routes/appRoutes"));
app.use("/api/legal", require("./routes/legalRoutes"));

// CHAT
app.use("/api/chat", require("./routes/chatRoutes"));

// SPARK
app.use("/api/spark", require("./routes/sparkRoutes"));
app.use("/api/audio", require("./routes/audioRoutes"));
app.use("/api/reels", require("./routes/sparkRoutes"));
app.use("/api/spark-comments", require("./routes/sparkCommentRoutes"));

// CREATE
app.use("/api/create", require("./routes/createRoutes"));
app.use("/api/upload", require("./routes/createRoutes"));

// CALLS
app.use("/api/call", require("./routes/callRoutes"));

// NOTIFICATIONS
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ADMIN
app.use("/api/admin", require("./routes/adminRoutes"));

// WALLET
app.use("/api/wallet", require("./routes/walletRoutes"));

// SUBSCRIPTION
app.use("/api/subscription", require("./routes/subscriptionRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// REFERRAL
app.use("/api/referral", require("./routes/referralRoutes"));

// SECURITY
app.use("/api/security", require("./routes/securityRoutes"));

// SUPPORT
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));

// =====================
// HEALTH CHECK
// =====================
app.get("/api", (req, res) => {
  res.json({
    success: true,
    app: "Chinky API",
    version: "1.0.0",
    status: "Running",
  });
});

app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? "healthy" : "database_unavailable",
  });
});

app.get("/health/config", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const canOperate = dbConnected && Object.values(coreEnv).every(Boolean);
  return res.status(canOperate ? 200 : 503).json({
    success: canOperate,
    core: {
      MONGO_URI: coreEnv.MONGO_URI,
      JWT_SECRET: coreEnv.JWT_SECRET,
      dbConnected,
    },
    integrations: optionalIntegrations,
  });
});

// The backend and website are delivered from one origin and one process.
// Only public browser assets are exposed; server launchers and local data are
// deliberately excluded from static serving.
app.use("/assets", express.static(path.join(websiteRoot, "assets"), {
  dotfiles: "deny",
  maxAge: isProd ? "1h" : 0,
}));

app.get(["/styles.css", "/app.js"], (req, res) => {
  res.set("Cache-Control", isProd ? "public, max-age=3600" : "no-cache");
  return res.sendFile(path.join(websiteRoot, req.path.slice(1)));
});

app.get("/", (req, res) => {
  res.set("Cache-Control", "no-cache");
  return res.sendFile(path.join(websiteRoot, "index.html"));
});

// =====================
// SOCKET SETUP
// =====================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: !isProd || allowedOrigins.length === 0 ? true : allowedOrigins,
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

require("./socket/socket")(io);
require("./config/redisAdapter")(io).catch((error) => {
  console.error("Redis adapter unavailable:", error.message);
});

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
