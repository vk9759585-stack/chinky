const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Controller
const sparkCommentController = require("../controllers/sparkCommentController");

// ====================================
// SPARK COMMENT ROUTES
// ====================================

// POST /spark-comments/:id/:commentId/replies -> Reply
router.post("/:id/:commentId/replies", authMiddleware, sparkCommentController.addReply);

// POST /spark-comments -> Add a comment
router.post("/", authMiddleware, sparkCommentController.addComment);

// GET /spark-comments/:id -> Get comments by spark ID
router.get("/:id", authMiddleware, sparkCommentController.getComments);
router.put("/:id/:commentId", authMiddleware, sparkCommentController.editComment);
router.delete("/:id/:commentId", authMiddleware, sparkCommentController.deleteComment);
router.post("/:id/:commentId/like", authMiddleware, sparkCommentController.toggleCommentLike);
router.post("/:id/:commentId/report", authMiddleware, sparkCommentController.reportComment);

module.exports = router;