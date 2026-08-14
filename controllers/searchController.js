const User = require("../models/User");
const Post = require("../models/Post");
const Spark = require("../models/Spark");

// =====================================
// SEARCH
// =====================================

exports.search = async (req, res) => {
    try {
        const query = (req.query.query || "").trim();

        if (!query) {
            return res.json({
                success: true,
                data: {
                    users: [],
                    posts: [],
                    sparks: []
                }
            });
        }

        const expression = new RegExp(
            query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i"
        );

        const [users, posts, sparks] = await Promise.all([
            User.find({
                $or: [
                    { username: expression },
                    { name: expression }
                ]
            })
                .select(
                    "name username profileImage verified"
                )
                .limit(20),

            Post.find({
                caption: expression
            })
                .populate(
                    "user",
                    "username profileImage"
                )
                .limit(20),

            Spark.find({
                $or: [
                    { caption: expression },
                    { hashtags: expression }
                ]
            })
                .populate(
                    "user",
                    "username profileImage"
                )
                .limit(20)
        ]);

        return res.json({
            success: true,
            data: {
                users,
                posts,
                sparks
            }
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// =====================================
// MATCH DEVICE CONTACTS
// =====================================

function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
}

exports.matchContacts = async (req, res) => {
    try {
        const phones = Array.isArray(req.body?.phones)
            ? req.body.phones.map(normalizePhone).filter((v) => v.length >= 7).slice(0, 400)
            : [];
        const emails = Array.isArray(req.body?.emails)
            ? req.body.emails.map((v) => String(v || "").trim().toLowerCase()).filter((v) => v.includes("@")).slice(0, 400)
            : [];

        if (!phones.length && !emails.length) {
            return res.json({ success: true, data: { users: [] } });
        }

        const phonePatterns = phones.map((phone) => new RegExp(`${phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
        const clauses = [];
        if (emails.length) clauses.push({ email: { $in: emails } });
        if (phonePatterns.length) clauses.push({ phone: { $in: phonePatterns } });

        const currentId = (req.user.id || req.user._id || req.user.userId).toString();
        const users = await User.find({
            _id: { $ne: currentId },
            banned: { $ne: true },
            isDeactivated: { $ne: true },
            $or: clauses
        })
            .select("name username profileImage verified")
            .limit(100)
            .lean();

        return res.json({ success: true, data: { users } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
