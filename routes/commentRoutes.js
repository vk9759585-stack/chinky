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

router.put(
    "/:id/:commentId",
    auth,
    controller.editComment
);

router.delete(
    "/:id/:commentId",
    auth,
    controller.deleteComment
);

router.post("/:id/:commentId/like", auth, controller.toggleCommentLike);
router.post("/:id/:commentId/report", auth, controller.reportComment);

module.exports = router;
