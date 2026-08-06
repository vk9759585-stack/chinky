const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Controller
const walletController = require("../controllers/walletController");

// ====================================
// WALLET ROUTES
// ====================================

// GET /wallet -> Get user wallet details
router.get("/", authMiddleware, walletController.getWallet);

// PUT /wallet/coins -> Add coins to wallet
router.put("/coins", authMiddleware, walletController.addCoins);

module.exports = router;