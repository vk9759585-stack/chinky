const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const upload = require("../config/multerConfig");

const controller = require("../controllers/storyController");

router.get(
    "/",
    auth,
    controller.getStories
);

router.post(
    "/upload",
    auth,
    upload.single("story"),
    controller.uploadStory
);

module.exports = router;