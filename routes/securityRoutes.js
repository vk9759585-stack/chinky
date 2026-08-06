const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Controller
const securityController = require("../controllers/securityController");

// ====================================
// SECURITY ROUTES
// ====================================

// GET /security/history
router.get("/history", authMiddleware, securityController.getLoginHistory);

module.exports = router;