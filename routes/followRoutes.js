const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/followController");

router.post("/:id", auth, controller.followUser);

router.delete("/:id", auth, controller.unfollowUser);

module.exports = router;