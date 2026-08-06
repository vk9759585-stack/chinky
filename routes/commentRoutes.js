const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/commentController");

// ====================================
// ADD COMMENT
// ====================================

router.post(
    "/:id/:commentId/replies",
    auth,
    controller.addReply
);

router.post(
    "/:id",
    auth,
    controller.addComment
);

// ====================================
// GET COMMENTS
// ====================================

router.get(
    "/:id",
    auth,
    controller.getComments
);

module.exports = router;
