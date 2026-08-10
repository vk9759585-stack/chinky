const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require(
    "../controllers/paymentController"
);

router.get('/coins/config', auth, controller.getCoinCheckoutConfig);
router.get('/coins/custom-quote', auth, controller.quoteCustomCoinPurchase);
router.post('/coins/order', auth, controller.createCoinOrder);
router.post('/coins/verify', auth, controller.verifyCoinPayment);
router.post('/coins/store/verify', auth, controller.verifyStoreCoinPurchase);
router.post('/coins/upi-request', auth, controller.createUpiCoinRequest);
router.get('/coins/upi-requests', auth, controller.getMyUpiCoinRequests);

// ====================================
// CREATE PAYMENT ORDER
// ====================================

router.post(
    "/order",
    auth,
    controller.createOrder
);

module.exports = router;
