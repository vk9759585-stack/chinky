const bcrypt = require("bcryptjs");
const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");
const LoginSession = require("../models/LoginSession");
const SecurityEmailLog = require("../models/SecurityEmailLog");
const crypto = require("crypto");
const { sendSecurityEmail } = require("../services/emailService");

const tokenHash = (token) =>
    crypto.createHash("sha256").update(String(token || "")).digest("hex");

const maskEmail = (email) => {
    const value = String(email || "");
    const [name, domain] = value.split("@");
    if (!domain) return value;
    const masked = name.length <= 2
        ? `${name.slice(0, 1)}*`
        : `${name.slice(0, 2)}${"*".repeat(Math.min(6, name.length - 2))}`;
    return `${masked}@${domain}`;
};

const ensureCurrentSession = async (req) => {
    const sid = String(req.user.sid || "").trim();
    if (sid) {
        return LoginSession.findOne({
            user: req.user.id,
            sessionId: sid,
            revokedAt: null,
        });
    }

    const hash = tokenHash(req.authToken);
    let session = await LoginSession.findOne({
        user: req.user.id,
        tokenHash: hash,
    });
    if (!session) {
        session = await LoginSession.create({
            user: req.user.id,
            sessionId: crypto.randomBytes(24).toString("hex"),
            tokenHash: hash,
            deviceId: String(req.headers["x-chinky-device-id"] || "").slice(0, 160),
            deviceName: String(req.headers["x-chinky-device-name"] || "This device").slice(0, 120),
            operatingSystem: String(req.headers["x-chinky-os"] || "").slice(0, 120),
            browser: "",
            ipAddress: String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim(),
            loginMethod: "password",
            lastActiveAt: new Date(),
        });
    }
    return session;
};

// ======================================
// GET LOGIN HISTORY
// ======================================

exports.getLoginHistory = async (req, res) => {
    try {
        const history = await LoginHistory.find({
            user: req.user.id
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// DELETE LOGIN HISTORY
// ======================================

exports.deleteLoginHistory = async (req, res) => {
    try {

        await LoginHistory.deleteMany({
            user: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Login history deleted successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getSessions = async (req, res) => {
    try {
        const current = await ensureCurrentSession(req);
        const sessions = await LoginSession.find({
            user: req.user.id,
            revokedAt: null,
        }).sort({ lastActiveAt: -1 }).lean();

        return res.json({
            success: true,
            currentSessionId: String(current?._id || ""),
            data: sessions.map((row) => ({
                id: String(row._id),
                deviceName: row.deviceName || "Unknown device",
                operatingSystem: row.operatingSystem || "",
                browser: row.browser || "",
                ipAddress: row.ipAddress || "",
                location: row.location || "",
                loginMethod: row.loginMethod || "password",
                loggedInAt: row.createdAt,
                lastActiveAt: row.lastActiveAt || row.updatedAt,
                isCurrent: String(row._id) === String(current?._id),
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.logoutSessions = async (req, res) => {
    try {
        const current = await ensureCurrentSession(req);
        const ids = Array.isArray(req.body.sessionIds)
            ? req.body.sessionIds.map(String).filter(Boolean)
            : [];
        if (!ids.length) {
            return res.status(400).json({ success: false, message: "Select at least one device" });
        }

        const safeIds = ids.filter((id) => id !== String(current?._id || ""));
        if (!safeIds.length) {
            return res.status(400).json({
                success: false,
                message: "Your current device cannot be logged out from this list"
            });
        }

        const result = await LoginSession.updateMany(
            { _id: { $in: safeIds }, user: req.user.id, revokedAt: null },
            { $set: { revokedAt: new Date() } }
        );

        return res.json({
            success: true,
            loggedOut: result.modifiedCount || 0,
            message: `${result.modifiedCount || 0} device(s) logged out`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.logoutAllOtherSessions = async (req, res) => {
    try {
        const current = await ensureCurrentSession(req);
        const result = await LoginSession.updateMany(
            {
                user: req.user.id,
                _id: { $ne: current?._id },
                revokedAt: null,
            },
            { $set: { revokedAt: new Date() } }
        );
        return res.json({
            success: true,
            loggedOut: result.modifiedCount || 0,
            message: "Other devices have been logged out"
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getRecentEmails = async (req, res) => {
    try {
        const rows = await SecurityEmailLog.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
        return res.json({
            success: true,
            data: rows.map((row) => ({
                id: String(row._id),
                subject: row.subject,
                type: row.type,
                status: row.status,
                recipient: maskEmail(row.recipient),
                createdAt: row.createdAt,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSecurityCheckup = async (req, res) => {
    try {
        await ensureCurrentSession(req);
        const user = await User.findById(req.user.id).lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const activeSessions = await LoginSession.countDocuments({
            user: req.user.id,
            revokedAt: null,
        });
        const recentFailed = await LoginHistory.countDocuments({
            user: req.user.id,
            status: "failed",
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });

        return res.json({
            success: true,
            data: {
                emailAdded: Boolean(user.email),
                phoneAdded: Boolean(user.phone),
                passwordUpdated: Boolean(user.passwordChangedAt),
                activeSessions,
                recentFailedLogins: recentFailed,
                recommendations: [
                    ...(activeSessions > 3
                        ? ["Review devices where you're logged in"]
                        : []),
                    ...(recentFailed > 0
                        ? ["Review recent login activity"]
                        : []),
                    ...(!user.passwordChangedAt
                        ? ["Consider updating your password"]
                        : []),
                ],
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        if (newPassword.length < 8) return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const matched = await bcrypt.compare(currentPassword, user.password);
        if (!matched) return res.status(400).json({ success: false, message: "Current password is incorrect" });
        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordChangedAt = new Date();
        await user.save();

        let emailStatus = "recorded";
        try {
            await sendSecurityEmail(
                user.email,
                "Your CHINKY password was changed",
                "The password for your CHINKY account was changed."
            );
            emailStatus = "sent";
        } catch (_) {
            emailStatus = "failed";
        }
        await SecurityEmailLog.create({
            user: user._id,
            recipient: user.email,
            subject: "Your CHINKY password was changed",
            type: "password_change",
            status: emailStatus,
        }).catch(() => {});

        return res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
