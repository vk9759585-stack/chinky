const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");
const controller = require("../controllers/vibesController");

router.get("/", auth, controller.getVibes);
router.post("/upload", auth, upload.single("story"), controller.createVibes);

router.put("/:id/like", auth, controller.likeVibes);
router.put("/:id/share", auth, controller.shareVibes);
router.get("/:id/comments", auth, controller.getComments);
router.post("/:id/comments", auth, controller.addComment);
router.post("/:id/comments/:commentId/replies", auth, controller.addReply);

router.delete("/:id", auth, controller.deleteVibes);

module.exports = router;
