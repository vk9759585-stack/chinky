const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/commentController");

router.post("/:id", auth, controller.addComment);

module.exports = router;