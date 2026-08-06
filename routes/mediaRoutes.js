const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const controller = require("../controllers/mediaController");

// ====================================
// UPLOAD IMAGE
// ====================================

router.post(
    "/image",
    auth,
    upload.single("image"),
    controller.uploadImage
);

// ====================================
// UPLOAD VIDEO
// ====================================

router.post(
    "/video",
    auth,
    upload.single("video"),
    controller.uploadVideo
);

module.exports = router;