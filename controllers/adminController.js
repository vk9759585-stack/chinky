const User = require("../models/User");
const Post = require("../models/Post");
const Report = require("../models/Report");

// ===================================
// USERS
// ===================================

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ===================================
// POSTS
// ===================================

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find();

    res.json({
      success: true,
      data: posts,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ===================================
// REPORTS
// ===================================

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find();

    res.json({
      success: true,
      data: reports,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ===================================
// VERIFY USER
// ===================================

exports.verifyUser = async (req, res) => {

    try {

        const user = await User.findByIdAndUpdate(

            req.params.id,

            {
                verified: true
            },

            {
                new: true
            }

        );

        res.json({

            success: true,

            data: user

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ===================================
// BAN USER
// ===================================

exports.banUser = async (req, res) => {

    try {

        const user = await User.findByIdAndUpdate(

            req.params.id,

            {
                banned: true
            },

            {
                new: true
            }

        );

        res.json({

            success: true,

            data: user

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ===================================
// UNBAN USER
// ===================================

exports.unbanUser = async (req, res) => {

    try {

        const user = await User.findByIdAndUpdate(

            req.params.id,

            {
                banned: false
            },

            {
                new: true
            }

        );

        res.json({

            success: true,

            data: user

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};