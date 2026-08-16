const express = require("express");
const router = express.Router();
const controller = require("../controllers/moderationController");

router.post("/cloudinary", express.json({ limit: "1mb" }), controller.cloudinaryModeration);

module.exports = router;
