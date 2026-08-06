const Otp = require("../models/Otp");
const crypto = require("crypto");

const {
    sendOtp,
    normalizedPhone
} = require("../services/msg91Service");

// =====================================
// GENERATE OTP
// =====================================

exports.generateOtp = async (req, res) => {
    try {
        const phone = normalizedPhone(req.body.phone);

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid phone number"
            });
        }

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        const purpose =
            req.body.purpose || "login";

        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        await Otp.deleteMany({
            phone,
            purpose
        });

        await sendOtp(phone, otp);

        await Otp.create({
            phone,
            otp,
            purpose,
            expiresAt
        });

        return res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// =====================================
// VERIFY OTP
// =====================================

exports.verifyOtp = async (req, res) => {
    try {

        const phone = normalizedPhone(
            req.body.phone
        );

        const otp = req.body.otp;

        const purpose =
            req.body.purpose || "login";

        const record = await Otp.findOne({
            phone,
            otp,
            purpose
        });

        if (!record) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (record.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired"
            });
        }

        await Otp.deleteOne({
            _id: record._id
        });

        return res.json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};