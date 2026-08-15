const socialFeaturesRoutes = require("./routes/socialFeaturesRoutes");
const path = require("path");
const fs = require("fs");
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
const websiteRoot = path.resolve(__dirname, "website");
const audioLibraryRoot = path.resolve(__dirname, "audio-library");

const isNonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const isProd = process.env.NODE_ENV === "production";

const defaultProductionOrigins = [
  "https://chinkyapp.com",
  "https://www.chinkyapp.com",
];
const configuredOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : (isProd ? defaultProductionOrigins : []);

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
  if (isProd && req.hostname.toLowerCase() === "www.chinkyapp.com") {
    return res.redirect(308, `https://chinkyapp.com${req.originalUrl}`);
  }
  next();
});
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
app.use("/audio-library", express.static(audioLibraryRoot, {
  maxAge: isProd ? "30d" : 0,
  immutable: isProd
}));

// =====================
// DATABASE
// =====================
connectDB();
require("./services/scheduledLiveReminderService").startScheduledLiveReminders();

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
app.use("/api/family", require("./routes/familyPairingRoutes"));

// VIBES
app.use("/api/vibes", require("./routes/vibesRoutes"));
app.use("/api/vibes-seen", require("./routes/vibesSeenRoutes"));

// LIVE STREAMING (ZEGOCLOUD room tokens)
app.use("/api/live", require("./routes/liveRoutes"));
app.use("/api/app", require("./routes/appRoutes"));
app.use("/api/legal", require("./routes/legalRoutes"));

// CHAT
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/groups", require("./routes/groupChatRoutes"));

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

// CREATOR TOOLS: PK, guest, schedules, analytics, drafts and safety
app.use("/api/features", require("./routes/creatorFeaturesRoutes"));

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

app.get(["/styles.css", "/app.js", "/robots.txt", "/sitemap.xml"], (req, res) => {
  res.set("Cache-Control", isProd ? "public, max-age=3600" : "no-cache");
  return res.sendFile(path.join(websiteRoot, req.path.slice(1)));
});

app.get("/.well-known/assetlinks.json", (_req, res) => {
  res.set("Cache-Control", isProd ? "public, max-age=3600" : "no-cache");
  res.type("application/json");
  return res.sendFile(
    path.join(websiteRoot, ".well-known", "assetlinks.json"),
    { dotfiles: "allow" },
  );
});

const publicDocuments = Object.freeze({
  "/privacy-policy": {
    file: "privacy-policy.md",
    title: "Privacy Policy",
    description: "How CHINKY collects, uses, and protects account information.",
  },
  "/terms-of-service": {
    file: "terms-of-service.md",
    title: "Terms of Service",
    description: "The terms that apply when you create an account or use CHINKY.",
  },
  "/delete-account": {
    file: "delete-account.md",
    title: "Delete Your Account",
    description: "How to request deletion of your CHINKY account and associated data.",
  },
  "/child-safety": {
    file: "csae-policy.md",
    title: "Child Safety Standards",
    description: "CHINKY standards against child sexual abuse and exploitation.",
  },
  "/audio-policy": {
    file: "audio-policy.md",
    title: "Audio Policy",
    description: "Rules for uploading, saving, and reusing audio on CHINKY.",
  },
});

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const renderInlineDocumentText = (value) => escapeHtml(value).replace(
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  (email) => `<a href="mailto:${email}">${email}</a>`,
);

function renderDocumentMarkdown(markdown) {
  const html = [];
  let listOpen = false;

  const closeList = () => {
    if (!listOpen) return;
    html.push("</ul>");
    listOpen = false;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${renderInlineDocumentText(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInlineDocumentText(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInlineDocumentText(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

function renderPublicDocumentPage(route, document) {
  const markdown = fs.readFileSync(path.join(__dirname, document.file), "utf8");
  const canonicalUrl = `https://chinkyapp.com${route}`;
  return `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(document.description)}" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#101017" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="icon" type="image/png" href="/assets/chinky-logo.png" />
    <link rel="stylesheet" href="/styles.css" />
    <title>${escapeHtml(document.title)} | CHINKY</title>
  </head>
  <body class="legal-page-body">
    <a class="skip-link" href="#document">Skip to document</a>
    <header class="legal-page-header">
      <div class="container">
        <a class="brand" href="/" aria-label="CHINKY home">
          <img src="/assets/chinky-logo.png" alt="" width="44" height="44" />
          <span>CHINKY</span>
        </a>
        <a class="button button--small button--ghost" href="/">Back to home</a>
      </div>
    </header>
    <main class="legal-page-main" id="document">
      <article class="legal-page-card">
        <span class="section-kicker">CHINKY policies</span>
        ${renderDocumentMarkdown(markdown)}
        <div class="legal-page-help">
          <strong>Need help?</strong>
          <span>Contact <a href="mailto:appchinky@gmail.com">appchinky@gmail.com</a></span>
        </div>
      </article>
    </main>
    <footer class="legal-page-footer">
      <span>© ${new Date().getFullYear()} CHINKY</span>
      <a href="/privacy-policy">Privacy</a>
      <a href="/terms-of-service">Terms</a>
      <a href="/delete-account">Account deletion</a>
    </footer>
  </body>
</html>`;
}

app.get(Object.keys(publicDocuments), (req, res, next) => {
  try {
    res.set("Cache-Control", isProd ? "public, max-age=3600" : "no-cache");
    res.type("html");
    return res.send(renderPublicDocumentPage(req.path, publicDocuments[req.path]));
  } catch (error) {
    return next(error);
  }
});


const sharePage = ({ title, description, canonicalUrl, imageUrl = "https://chinkyapp.com/assets/chinky-logo.png" }) => `<!doctype html>
<html lang="en" data-theme="dark"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="CHINKY">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}"><meta property="og:image" content="${escapeHtml(imageUrl)}">
<meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta name="theme-color" content="#000000"><link rel="stylesheet" href="/styles.css"></head>
<body><main class="legal-page-main"><article class="legal-page-card"><a class="brand" href="/"><img src="/assets/chinky-logo.png" alt=""><span>CHINKY</span></a><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><a class="button" href="/">Open CHINKY</a></article></main></body></html>`;

app.get("/spark/:id", async (req, res, next) => {
  try {
    const Spark = require("./models/Spark");
    const spark = await Spark.findById(req.params.id).populate("user", "username name").lean();
    if (!spark) return res.status(404).send("Spark not found");
    const creator = spark.user?.username ? `@${spark.user.username}` : "CHINKY creator";
    const description = spark.caption || `Watch this Spark from ${creator} on CHINKY.`;
    return res.send(sharePage({title:`${creator} on CHINKY`, description, canonicalUrl:`https://chinkyapp.com/spark/${spark._id}`, imageUrl:spark.thumbnail || "https://chinkyapp.com/assets/chinky-logo.png"}));
  } catch (e) { return next(e); }
});
app.get("/p/:id", async (req, res, next) => {
  try {
    const Post = require("./models/Post");
    const post = await Post.findById(req.params.id).populate("user", "username name").lean();
    if (!post) return res.status(404).send("Post not found");
    const creator = post.user?.username ? `@${post.user.username}` : "CHINKY creator";
    const description = post.caption || `See this post from ${creator} on CHINKY.`;
    return res.send(sharePage({title:`${creator} on CHINKY`, description, canonicalUrl:`https://chinkyapp.com/p/${post._id}`, imageUrl:post.thumbnail || post.image || "https://chinkyapp.com/assets/chinky-logo.png"}));
  } catch (e) { return next(e); }
});
app.get("/@:username", async (req, res, next) => {
  try {
    const User = require("./models/User");
    const user = await User.findOne({username:req.params.username.toLowerCase()}).lean();
    if (!user) return res.status(404).send("Profile not found");
    const description = user.bio || `Follow @${user.username} on CHINKY.`;
    return res.send(sharePage({title:`@${user.username} • CHINKY`, description, canonicalUrl:`https://chinkyapp.com/@${encodeURIComponent(user.username)}`, imageUrl:user.profileImage || "https://chinkyapp.com/assets/chinky-logo.png"}));
  } catch (e) { return next(e); }
});

const defaultAndroidDownloadUrl = "https://play.google.com/store/apps/details?id=com.chinky.social";

app.get("/download", (req, res) => {
  const configuredUrl = String(process.env.CHINKY_APP_DOWNLOAD_URL || "").trim();
  const downloadUrl = configuredUrl || defaultAndroidDownloadUrl;
  res.set("Cache-Control", "no-store");
  return res.redirect(302, downloadUrl);
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

require("./services/supportMonitorService").startSupportMonitor(app);

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
app.use("/api/social-features", socialFeaturesRoutes);

