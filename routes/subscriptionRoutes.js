const router = require("express").Router();

const auth =
require("../middleware/authMiddleware");

const controller =
require("../controllers/subscriptionController");

router.post(
    "/",
    auth,
    controller.createSubscription
);

router.get(
    "/",
    auth,
    controller.getSubscription
);

module.exports = router;