const router = require("express").Router();

const authController = require("../controllers/authController");
const otpController = require("../controllers/otpController");
const resetController = require("../controllers/resetPasswordController");

// ====================================
// AUTH
// ====================================

router.post(
    "/register",
    authController.register
);

router.post(
    "/login",
    authController.login
);

// ====================================
// OTP
// ====================================

router.post(
    "/send-otp",
    otpController.generateOtp
);

router.post(
    "/verify-otp",
    otpController.verifyOtp
);

// ====================================
// PASSWORD RESET
// ====================================

router.post(
    "/forgot-password",
    resetController.verifyOtp
);

router.post(
    "/reset-password",
    resetController.resetPassword
);

module.exports = router;
