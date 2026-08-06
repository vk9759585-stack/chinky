const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/likeController");

// ====================================
// LIKE / UNLIKE POST
// ====================================

router.post(
    "/:id",
    auth,
    controller.likePost
);

module.exports = router;