const express = require("express");
const router = express.Router();

// Middleware
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");

// Controller
const sparkController = require("../controllers/sparkController");

// ====================================
// SPARK ROUTES
// ====================================

router.get("/upload-status/:key", authMiddleware, sparkController.getUploadStatus);

// POST /sparks -> Create a new spark (with video upload)
router.post(
  "/",
  authMiddleware,
  upload.fields([{ name: "video", maxCount: 1 }, { name: "overlay", maxCount: 1 }]),
  sparkController.createSpark
);

// GET /sparks -> Get all sparks
router.get("/", authMiddleware, sparkController.getSparks);

// PUT /sparks/like/:id -> Like a spark
router.put("/like/:id", authMiddleware, sparkController.likeSpark);

// PUT /sparks/save/:id -> Save a spark
router.put("/save/:id", authMiddleware, sparkController.saveSpark);

// PUT /sparks/view/:id -> Add view count
router.put("/view/:id", authMiddleware, sparkController.addView);

// PUT /sparks/share/:id -> Share a spark
router.put("/share/:id", authMiddleware, sparkController.shareSpark);

router.delete("/:id", authMiddleware, sparkController.deleteSpark);

router.post("/report/:id", authMiddleware, sparkController.reportSpark);

router.post("/:id/gifts", authMiddleware, sparkController.sendGift);

module.exports = router;
