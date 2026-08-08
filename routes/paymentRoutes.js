const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require(
    "../controllers/paymentController"
);

router.get('/coins/config', auth, controller.getCoinCheckoutConfig);
router.post('/coins/order', auth, controller.createCoinOrder);
router.post('/coins/verify', auth, controller.verifyCoinPayment);

// ====================================
// CREATE PAYMENT ORDER
// ====================================

router.post(
    "/order",
    auth,
    controller.createOrder
);

module.exports = router;
