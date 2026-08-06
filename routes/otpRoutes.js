const router = require("express").Router();

const controller = require("../controllers/otpController");

// ====================================
// GENERATE OTP
// ====================================

router.post(
    "/generate",
    controller.generateOtp
);

// ====================================
// VERIFY OTP
// ====================================

router.post(
    "/verify",
    controller.verifyOtp
);

module.exports = router;