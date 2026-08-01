const bcrypt = require("bcryptjs");

const User = require("../models/User");

// VERIFY OTP

exports.verifyOtp = async (req, res) => {

    try {

        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (user.otpExpire < Date.now()) {
            return res.status(400).json({
                message: "OTP Expired"
            });
        }

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// RESET PASSWORD

exports.resetPassword = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const user = await User.findOne({
            email
        });

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }

        const hash = await bcrypt.hash(password, 10);

        user.password = hash;

        user.otp = "";

        user.otpExpire = null;

        await user.save();

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};