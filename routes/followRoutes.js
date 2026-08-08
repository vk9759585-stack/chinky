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

// ====================================
// FOLLOW LISTS
// ====================================

router.get(
    "/:id/followers",
    auth,
    controller.getFollowers
);

router.get(
    "/:id/following",
    auth,
    controller.getFollowing
);

module.exports = router;
