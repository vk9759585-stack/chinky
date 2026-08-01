const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/likeController");

router.post("/:id", auth, controller.likePost);

module.exports = router;