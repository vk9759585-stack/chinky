const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");
const LoginSession = require("../models/LoginSession");
const SecurityEmailLog = require("../models/SecurityEmailLog");
const { sendSecurityEmail } = require("../services/emailService");

const normalizeIdentifier = (value) => String(value || "").trim();
const normalizeUsername = (value) => normalizeIdentifier(value).toLowerCase();
const normalizeEmail = (value) => normalizeIdentifier(value).toLowerCase();
const normalizePhone = (value) => normalizeIdentifier(value).replace(/[\s()-]/g, "");

const publicUser = (user) => {
    const data = user.toObject ? user.toObject() : { ...user };
    delete data.password;
    delete data.otp;
    delete data.otpExpire;
    delete data.resetPasswordToken;
    delete data.resetPasswordExpire;
    return data;
};

const tokenHash = (token) =>
    crypto.createHash("sha256").update(String(token || "")).digest("hex");

const issueToken = (userId, sessionId) => {
    const secret = String(process.env.JWT_SECRET || "").trim();
    if (!secret) {
        const error = new Error("Server authentication is not configured");
        error.code = "JWT_SECRET_MISSING";
        throw error;
    }
    return jwt.sign(
        { id: userId, sid: sessionId },
        secret,
        { expiresIn: "30d" }
    );
};

const clientIp = (req) =>
    String(req.headers["x-forwarded-for"] || req.ip || "")
        .split(",")[0]
        .trim();

const deviceMeta = (req) => ({
    deviceId: String(req.body.deviceId || "").trim().slice(0, 160),
    deviceName: String(req.body.deviceName || "Unknown device").trim().slice(0, 120),
    operatingSystem: String(req.body.operatingSystem || "").trim().slice(0, 120),
    browser: String(req.body.browser || "").trim().slice(0, 120),
    ipAddress: clientIp(req),
});

const createSession = async (req, user, loginMethod) => {
    const sessionId = crypto.randomBytes(24).toString("hex");
    const token = issueToken(user._id, sessionId);
    const meta = deviceMeta(req);
    await LoginSession.create({
        user: user._id,
        sessionId,
        tokenHash: tokenHash(token),
        ...meta,
        loginMethod,
        lastActiveAt: new Date(),
    });
    await LoginHistory.create({
        user: user._id,
        ipAddress: meta.ipAddress,
        device: meta.deviceName,
        browser: meta.browser,
        operatingSystem: meta.operatingSystem,
        location: "",
        loginMethod: ["email", "phone", "username"].includes(loginMethod)
            ? loginMethod
            : "email",
        status: "success",
    }).catch(() => {});
    return token;
};

const recordSecurityEmail = async (user, subject, message, type) => {
    let status = "recorded";
    try {
        await sendSecurityEmail(user.email, subject, message);
        status = "sent";
    } catch (_) {
        status = "failed";
    }
    await SecurityEmailLog.create({
        user: user._id,
        recipient: user.email,
        subject,
        type,
        status,
    }).catch(() => {});
};

// =====================================
// REGISTER
// =====================================

exports.register = async (req, res) => {
    try {
        const name = normalizeIdentifier(req.body.name);
        const username = normalizeUsername(req.body.username);
        const email = normalizeEmail(req.body.email);
        const phone = normalizePhone(req.body.phone);
        const password = String(req.body.password || "");

        if (!name || !username || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }, { phone }]
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email, username or phone is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, username, email, phone, password: hashedPassword });

        // Registration now creates a valid authenticated session immediately.
        // This prevents a freshly-created account from reaching Home without a token.
        const token = await createSession(req, user, "email");
        void recordSecurityEmail(
            user,
            "New CHINKY account sign-in",
            `Your CHINKY account was signed in on ${String(req.body.deviceName || "a new device")}.`,
            "login"
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: publicUser(user)
        });
    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({
            success: false,
            message: err.code === "JWT_SECRET_MISSING"
                ? "Server authentication is not configured"
                : "Could not create account. Please try again."
        });
    }
};

// =====================================
// LOGIN
// =====================================

exports.login = async (req, res) => {
    try {
        const rawLogin = normalizeIdentifier(req.body.login);
        const password = String(req.body.password || "");

        if (!rawLogin || !password) {
            return res.status(400).json({ success: false, message: "Login credentials are required" });
        }

        const usernameOrEmail = rawLogin.toLowerCase();
        const phone = normalizePhone(rawLogin);

        const user = await User.findOne({
            $or: [
                { email: usernameOrEmail },
                { username: usernameOrEmail },
                { phone }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.banned === true) {
            return res.status(403).json({ success: false, message: "Your account has been banned." });
        }

        if (typeof user.password !== "string" || user.password.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Password is not set for this account. Use Forgot password to create one."
            });
        }

        let matchedPassword = false;
        try {
            matchedPassword = await bcrypt.compare(password, user.password);
        } catch (_) {
            matchedPassword = false;
        }

        // Compatibility for any very old records accidentally stored as plaintext.
        // On first successful login they are upgraded to bcrypt immediately.
        if (!matchedPassword && !/^\$2[aby]\$/.test(user.password) && password === user.password) {
            user.password = await bcrypt.hash(password, 10);
            matchedPassword = true;
        }

        if (!matchedPassword) {
            await LoginHistory.create({
                user: user._id,
                ipAddress: clientIp(req),
                device: String(req.body.deviceName || "Unknown device"),
                browser: String(req.body.browser || ""),
                operatingSystem: String(req.body.operatingSystem || ""),
                location: "",
                loginMethod: rawLogin.includes("@") ? "email" : "username",
                status: "failed",
            }).catch(() => {});
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        if (user.isDeactivated === true) {
            user.isDeactivated = false;
            user.deactivatedAt = null;
        }

        user.lastLoginAt = new Date();
        await user.save();

        const loginMethod = rawLogin.includes("@")
            ? "email"
            : (/^[+\d]/.test(rawLogin) ? "phone" : "username");
        const token = await createSession(req, user, loginMethod);
        void recordSecurityEmail(
            user,
            "New login to your CHINKY account",
            `A login was detected on ${String(req.body.deviceName || "a device")}.`,
            "login"
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: publicUser(user)
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            success: false,
            message: err.code === "JWT_SECRET_MISSING"
                ? "Server authentication is not configured"
                : "Could not sign in right now. Please try again."
        });
    }
};
