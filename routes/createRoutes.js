const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const controller = require("../controllers/createController");

// ====================================
// UPLOAD MEDIA
// ====================================

router.post(
    "/",
    auth,
    upload.single("file"),
    controller.createMedia
);

module.exports = router;