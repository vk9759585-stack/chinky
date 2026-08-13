const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Spark = require("../models/Spark");
const Post = require("../models/Post");
const Vibes = require("../models/Vibes");
const WaitlistEntry = require("../models/WaitlistEntry");
const authMiddleware = require("../middleware/authMiddleware");

const loginAttempts = new Map();
const waitlistAttempts = new Map();
const isProduction = process.env.NODE_ENV === "production";

function clientKey(req) {
  return String(req.ip || req.socket?.remoteAddress || "unknown");
}

function isLimited(store, req, max, windowMs = 15 * 60_000) {
  const key = clientKey(req);
  const now = Date.now();
  const state = store.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > state.resetAt) {
    state.count = 0;
    state.resetAt = now + windowMs;
  }
  state.count += 1;
  store.set(key, state);
  return state.count > max;
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const separator = value.indexOf("=");
        if (separator < 0) return [value, ""];
        return [value.slice(0, separator), decodeURIComponent(value.slice(separator + 1))];
      }),
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

function clearCookieOptions() {
  const { maxAge, ...options } = cookieOptions();
  return options;
}

function publicUser(user = {}) {
  return {
    id: user._id || user.id,
    name: user.name || "",
    username: user.username || "",
    profileImage: user.profileImage || "",
    verified: user.verified === true,
  };
}

exports.sameOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  const forwardedProtocol = String(req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0].trim();
  const expected = `${forwardedProtocol}://${req.get("host")}`;
  if (origin !== expected) return res.status(403).json({ success: false, message: "Request blocked" });
  return next();
};

exports.browserAuth = (req, res, next) => {
  const token = parseCookies(req).chinky_session;
  if (!token) return res.status(401).json({ success: false, message: "Please log in to continue" });
  req.headers.authorization = `Bearer ${token}`;
  return authMiddleware(req, res, next);
};

exports.login = async (req, res) => {
  if (isLimited(loginAttempts, req, 8)) {
    return res.status(429).json({ success: false, message: "Too many login attempts. Please wait and try again." });
  }

  const login = String(req.body?.login || "").trim().slice(0, 120);
  const password = String(req.body?.password || "");
  if (!login || !password || password.length > 128) {
    return res.status(400).json({ success: false, message: "Enter valid login details" });
  }

  try {
    const user = await User.findOne({ $or: [{ email: login.toLowerCase() }, { username: login.toLowerCase() }, { phone: login }] });
    if (!user || user.banned || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Login details are incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "30d" });
    res.cookie("chinky_session", token, cookieOptions());
    return res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error("Website login error:", error.message);
    return res.status(503).json({ success: false, message: "CHINKY is temporarily unavailable" });
  }
};

exports.session = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name username profileImage verified banned");
    if (!user || user.banned) {
      res.clearCookie("chinky_session", clearCookieOptions());
      return res.status(401).json({ success: false, message: "Session is no longer available" });
    }
    return res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    return res.status(503).json({ success: false, message: "CHINKY is temporarily unavailable" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("chinky_session", clearCookieOptions());
  return res.json({ success: true });
};

exports.joinWaitlist = async (req, res) => {
  if (isLimited(waitlistAttempts, req, 20)) {
    return res.status(429).json({ success: false, message: "Too many requests. Please wait and try again." });
  }

  const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Enter a valid email address" });
  }

  try {
    const existing = await WaitlistEntry.findOne({ email }).select("_id").lean();
    if (existing) return res.json({ success: true, joined: false, message: "You are already on the waitlist" });
    await WaitlistEntry.create({ email, source: "website" });
    return res.status(201).json({ success: true, joined: true, message: "You are on the CHINKY waitlist" });
  } catch (error) {
    if (error?.code === 11000) return res.json({ success: true, joined: false, message: "You are already on the waitlist" });
    console.error("Website waitlist error:", error.message);
    return res.status(503).json({ success: false, message: "Could not join the waitlist. Please try again." });
  }
};


function metaEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function absoluteUrl(req, value, fallback = "/assets/chinky-friends.png") {
  const origin = "https://chinkyapp.com";
  const raw = String(value || "").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const chosen = raw || fallback;
  return `${origin}${chosen.startsWith("/") ? chosen : `/${chosen}`}`;
}

function sharePage({ title, description, canonical, image, kind, username = "" }) {
  const safeTitle = metaEscape(title);
  const safeDescription = metaEscape(description);
  const safeCanonical = metaEscape(canonical);
  const safeImage = metaEscape(image);
  const safeKind = metaEscape(kind);
  const safeUsername = metaEscape(username);
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="theme-color" content="#f8f8fb" />
  <link rel="canonical" href="${safeCanonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="CHINKY" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:image" content="${safeImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${safeImage}" />
  <link rel="icon" type="image/png" href="/assets/chinky-logo.png" />
  <link rel="stylesheet" href="/styles.css" />
  <title>${safeTitle}</title>
</head>
<body class="share-page-body">
  <main class="share-page-shell">
    <a class="brand share-page-brand" href="/" aria-label="CHINKY home">
      <img src="/assets/chinky-logo.png" alt="" width="44" height="44" />
      <span>CHINKY</span>
    </a>
    <article class="share-page-card">
      <div class="share-page-media"><img src="${safeImage}" alt="${safeTitle}" /></div>
      <div class="share-page-copy">
        <span class="section-kicker">${safeKind}${safeUsername ? ` · @${safeUsername}` : ""}</span>
        <h1>${safeTitle}</h1>
        <p>${safeDescription}</p>
        <div class="share-page-actions">
          <a class="button button--primary" href="/">Open CHINKY</a>
          <button class="button button--ghost" type="button" onclick="navigator.clipboard?.writeText(location.href);this.textContent='Link copied'">Copy link</button>
        </div>
      </div>
    </article>
  </main>
</body>
</html>`;
}

exports.sparkSharePage = async (req, res) => {
  try {
    const spark = await Spark.findById(req.params.id).populate("user", "name username profileImage").lean();
    if (!spark) return res.status(404).send("Spark not found");
    const username = spark.user?.username || "creator";
    const title = spark.caption?.trim() || `Watch @${username}'s Spark on CHINKY`;
    const description = `Watch this Spark from @${username} on CHINKY.`;
    const canonical = `https://chinkyapp.com/spark/${encodeURIComponent(String(spark._id))}`;
    const image = absoluteUrl(req, spark.thumbnail || spark.user?.profileImage);
    res.set("Cache-Control", "public, max-age=300");
    return res.type("html").send(sharePage({ title, description, canonical, image, kind: "Spark", username }));
  } catch (_) {
    return res.status(404).send("Spark not found");
  }
};

exports.postSharePage = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", "name username profileImage").lean();
    if (!post || post.isArchived) return res.status(404).send("Post not found");
    const username = post.user?.username || "creator";
    const title = post.caption?.trim() || `See @${username}'s post on CHINKY`;
    const description = `See this post from @${username} on CHINKY.`;
    const canonical = `https://chinkyapp.com/p/${encodeURIComponent(String(post._id))}`;
    const image = absoluteUrl(req, post.thumbnail || (post.mediaType === "image" ? post.image : "") || post.user?.profileImage);
    res.set("Cache-Control", "public, max-age=300");
    return res.type("html").send(sharePage({ title, description, canonical, image, kind: "Post", username }));
  } catch (_) {
    return res.status(404).send("Post not found");
  }
};

exports.vibesSharePage = async (req, res) => {
  try {
    const vibe = await Vibes.findById(req.params.id).populate("user", "name username profileImage").lean();
    if (!vibe) return res.status(404).send("Vibes not found");
    const username = vibe.user?.username || "creator";
    const title = vibe.caption?.trim() || `View @${username}'s Vibes on CHINKY`;
    const description = `View this Vibes from @${username} on CHINKY.`;
    const canonical = `https://chinkyapp.com/vibes/${encodeURIComponent(String(vibe._id))}`;
    const image = absoluteUrl(req, vibe.isVideo ? vibe.user?.profileImage : vibe.media);
    res.set("Cache-Control", "public, max-age=180");
    return res.type("html").send(sharePage({ title, description, canonical, image, kind: "Vibes", username }));
  } catch (_) {
    return res.status(404).send("Vibes not found");
  }
};

exports.profileSharePage = async (req, res) => {
  try {
    const username = String(req.params.username || "").toLowerCase().trim();
    const user = await User.findOne({ username, banned: { $ne: true }, isDeactivated: { $ne: true } })
      .select("name username bio profileImage privacySettings")
      .lean();
    if (!user) return res.status(404).send("Profile not found");
    const title = `${user.name || `@${user.username}`} (@${user.username}) on CHINKY`;
    const description = user.bio?.trim() || `Follow @${user.username} on CHINKY.`;
    const canonical = `https://chinkyapp.com/@${encodeURIComponent(user.username)}`;
    const allowImage = user.privacySettings?.displayProfileWhenSharingLinks !== false;
    const image = absoluteUrl(req, allowImage ? user.profileImage : "");
    res.set("Cache-Control", "public, max-age=300");
    return res.type("html").send(sharePage({ title, description, canonical, image, kind: "Profile", username: user.username }));
  } catch (_) {
    return res.status(404).send("Profile not found");
  }
};
