const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Controller
const sparkCommentController = require("../controllers/sparkCommentController");

// ====================================
// SPARK COMMENT ROUTES
// ====================================

// POST /spark-comments -> Add a comment
router.post("/", authMiddleware, sparkCommentController.addComment);

// GET /spark-comments/:id -> Get comments by spark ID
router.get("/:id", authMiddleware, sparkCommentController.getComments);

module.exports = router;