const router = require("express").Router();

const auth =
require("../middleware/authMiddleware");

const controller =
require("../controllers/referralController");

router.post(
    "/",
    auth,
    controller.createReferral
);

module.exports = router;