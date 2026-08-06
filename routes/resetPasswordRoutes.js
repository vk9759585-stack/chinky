const router = require("express").Router();

const controller = require(
    "../controllers/resetPasswordController"
);

// ====================================
// VERIFY OTP
// ====================================

router.post(
    "/verify",
    controller.verifyOtp
);

// ====================================
// RESET PASSWORD
// ====================================

router.post(
    "/reset",
    controller.resetPassword
);

module.exports = router;