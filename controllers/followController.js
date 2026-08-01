const User = require("../models/User");

exports.followUser = async (req, res) => {
  try {
    const myId = req.user.id;
    const userId = req.params.id;

    if (myId === userId) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const me = await User.findById(myId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!me.following.includes(userId)) {
      me.following.push(userId);
      user.followers.push(myId);

      await me.save();
      await user.save();
    }

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const myId = req.user.id;
    const userId = req.params.id;

    await User.findByIdAndUpdate(myId, {
      $pull: {
        following: userId,
      },
    });

    await User.findByIdAndUpdate(userId, {
      $pull: {
        followers: myId,
      },
    });

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};