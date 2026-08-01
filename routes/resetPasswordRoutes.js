const router = require("express").Router();

const controller = require("../controllers/resetPasswordController");

router.post("/verify", controller.verifyOtp);

router.post("/reset", controller.resetPassword);

module.exports = router;