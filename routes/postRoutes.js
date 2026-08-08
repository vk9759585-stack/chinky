const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const controller = require("../controllers/postController");

// ====================================
// GET FLOW
// ====================================

router.get(
    "/",
    auth,
    controller.getFlow
);

// ====================================
// CREATE POST
// ====================================

router.post(
    "/",
    auth,
    upload.single("image"),
    controller.createPost
);

router.put("/:id", auth, controller.updatePost);

router.post(
    "/:id/save",
    auth,
    controller.toggleSavePost
);

router.post(
    "/:id/share",
    auth,
    controller.recordShare
);

router.put(
    "/:id/view",
    auth,
    controller.addView
);

// ====================================
// DELETE POST
// ====================================

router.delete(
    "/:id",
    auth,
    controller.deletePost
);

module.exports = router;
