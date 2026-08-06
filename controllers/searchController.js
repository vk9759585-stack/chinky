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