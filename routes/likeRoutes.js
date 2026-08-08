const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/likeController");

// ====================================
// LIKE / UNLIKE POST
// ====================================

router.get("/:id", auth, controller.getPostLikes);

router.post(
    "/:id",
    auth,
    controller.likePost
);

module.exports = router;