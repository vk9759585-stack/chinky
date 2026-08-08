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
router.post("/change-password", authMiddleware, securityController.changePassword);

module.exports = router;