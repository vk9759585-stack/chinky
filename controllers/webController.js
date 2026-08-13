const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
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
