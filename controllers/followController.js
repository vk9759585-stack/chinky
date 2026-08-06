const User = require("../models/User");

// =====================================
// FOLLOW USER
// =====================================

exports.followUser = async (req, res) => {
    try {
        const myId = req.user.id;
        const userId = req.params.id;

        if (myId === userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            });
        }

        const me = await User.findById(myId);
        const user = await User.findById(userId);

        if (!me || !user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (me.following.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "Already following this user"
            });
        }

        me.following.push(userId);
        user.followers.push(myId);

        await me.save();
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User followed successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// UNFOLLOW USER
// =====================================

exports.unfollowUser = async (req, res) => {
    try {
        const myId = req.user.id;
        const userId = req.params.id;

        await User.findByIdAndUpdate(myId, {
            $pull: {
                following: userId
            }
        });

        await User.findByIdAndUpdate(userId, {
            $pull: {
                followers: myId
            }
        });

        return res.status(200).json({
            success: true,
            message: "User unfollowed successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// GET FOLLOWERS
// =====================================

exports.getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate(
                "followers",
                "name username profileImage"
            );

        return res.json({
            success: true,
            count: user.followers.length,
            data: user.followers
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// GET FOLLOWING
// =====================================

exports.getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate(
                "following",
                "name username profileImage"
            );

        return res.json({
            success: true,
            count: user.following.length,
            data: user.following
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};