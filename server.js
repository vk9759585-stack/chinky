require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// DB Connection (separate file recommended)
const connectDB = require("./config/db");

// Initialize app
const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
  origin: "*", // production me specific domain use karo
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use("/uploads", express.static("uploads"));

// =====================
// DATABASE
// =====================
connectDB();

// =====================
// ROUTES
// =====================

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

// CHAT
app.use("/api/chat", require("./routes/chatRoutes"));

// SPARK
app.use("/api/spark", require("./routes/sparkRoutes"));
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

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "Chinky API",
    version: "1.0.0",
    status: "Running",
  });
});

// =====================
// SOCKET SETUP
// =====================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // production me restrict karo
    methods: ["GET", "POST"],
  },
});

require("./socket/socket")(io);

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
