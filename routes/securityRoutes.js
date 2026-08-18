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
router.get("/sessions", authMiddleware, securityController.getSessions);
router.post("/sessions/logout", authMiddleware, securityController.logoutSessions);
router.post("/sessions/logout-others", authMiddleware, securityController.logoutAllOtherSessions);
router.get("/recent-emails", authMiddleware, securityController.getRecentEmails);
router.get("/checkup", authMiddleware, securityController.getSecurityCheckup);
router.post("/change-password", authMiddleware, securityController.changePassword);

module.exports = router;