const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const upload = require("../config/multerConfig");

const controller = require("../controllers/postController");

// Feed

router.get(

    "/",

    auth,

    controller.getFeed

);

// Create Post

router.post(

    "/",

    auth,

    upload.single("image"),

    controller.createPost

);

// Delete

router.delete(

    "/:id",

    auth,

    controller.deletePost

);

module.exports = router;