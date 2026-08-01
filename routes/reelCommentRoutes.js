const router=require("express").Router();

const auth=require("../middleware/authMiddleware");

const controller=require("../controllers/reelCommentController");

router.post(
"/",
auth,
controller.addComment
);

router.get(
"/:id",
auth,
controller.getComments
);

module.exports=router;