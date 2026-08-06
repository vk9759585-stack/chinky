const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require(
    "../controllers/paymentController"
);

// ====================================
// CREATE PAYMENT ORDER
// ====================================

router.post(
    "/order",
    auth,
    controller.createOrder
);

module.exports = router;