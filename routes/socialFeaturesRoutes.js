const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/socialFeaturesController");

// Real, purpose-specific social tools only.
router.get("/profile-code", auth, controller.profileQr);

router.get("/close-friends", auth, controller.closeFriends);
router.post("/close-friends", auth, controller.addCloseFriend);
router.delete("/close-friends/:id", auth, controller.removeCloseFriend);

module.exports = router;
