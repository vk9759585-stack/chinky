const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Controller
const vibesSeenController = require("../controllers/vibesSeenController");

// ====================================
// VIBES SEEN ROUTE
// ====================================

// POST /vibes-seen/:id -> Mark a vibe as seen
router.get("/:id/viewers", authMiddleware, vibesSeenController.getViewers);
router.post("/:id", authMiddleware, vibesSeenController.vibesSeen);

module.exports = router;