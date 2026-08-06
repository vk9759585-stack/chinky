const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/referralController");

// ====================================
// CREATE REFERRAL
// ====================================

router.post(
    "/",
    auth,
    controller.createReferral
);

module.exports = router;