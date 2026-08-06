const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/followController");

// ====================================
// FOLLOW USER
// ====================================

router.post(
    "/:id",
    auth,
    controller.followUser
);

// ====================================
// UNFOLLOW USER
// ====================================

router.delete(
    "/:id",
    auth,
    controller.unfollowUser
);

module.exports = router;