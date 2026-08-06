const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Controller
const subscriptionController = require("../controllers/subscriptionController");

// ====================================
// SUBSCRIPTION ROUTES
// ====================================

// POST /subscriptions -> Create a subscription
router.post("/", authMiddleware, subscriptionController.createSubscription);

// GET /subscriptions -> Get user subscription details
router.get("/", authMiddleware, subscriptionController.getSubscription);

module.exports = router;