const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const LoginSession = require("../models/LoginSession");

// ======================================
// AUTH MIDDLEWARE
// ======================================

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Access denied"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token not found"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const userId =
            decoded?.id ||
            decoded?._id ||
            decoded?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User id missing from token"
            });
        }

        const sid = String(decoded?.sid || "").trim();
        const hashed = crypto.createHash("sha256").update(token).digest("hex");

        if (sid) {
            const session = await LoginSession.findOne({
                user: userId,
                sessionId: sid,
                revokedAt: null,
            }).select("_id lastActiveAt");
            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: "This login session has been signed out"
                });
            }
            const stale = !session.lastActiveAt ||
                (Date.now() - new Date(session.lastActiveAt).getTime()) > 5 * 60 * 1000;
            if (stale) {
                LoginSession.updateOne(
                    { _id: session._id },
                    { $set: { lastActiveAt: new Date() } }
                ).catch(() => {});
            }
        } else {
            // Legacy tokens remain valid, but once registered by Security they
            // can also be revoked by token hash.
            const legacy = await LoginSession.findOne({ user: userId, tokenHash: hashed });
            if (legacy?.revokedAt) {
                return res.status(401).json({
                    success: false,
                    message: "This login session has been signed out"
                });
            }
        }

        req.authToken = token;
        req.user = {
            ...decoded,
            id: userId.toString(),
            _id: userId.toString(),
            userId: userId.toString(),
            sid,
        };

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};