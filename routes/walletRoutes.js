const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Controller
const walletController = require("../controllers/walletController");
const dailyCheckInController = require("../controllers/dailyCheckInController");

// ====================================
// WALLET ROUTES
// ====================================

// GET /wallet -> Get user wallet details
router.get("/", authMiddleware, walletController.getWallet);
router.get("/coin-packages", authMiddleware, walletController.getCoinPackages);
router.get("/activity", authMiddleware, walletController.getActivity);
router.get("/gifts", authMiddleware, walletController.getGiftCatalog);

// Real 7-day daily check-in rewards. Server decides streak and coin credit.
router.get("/check-in", authMiddleware, dailyCheckInController.getStatus);
router.post("/check-in/claim", authMiddleware, dailyCheckInController.claim);

// PUT /wallet/coins -> Add coins to wallet
router.put("/coins", authMiddleware, walletController.addCoins);

module.exports = router;
