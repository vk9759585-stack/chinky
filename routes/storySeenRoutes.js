const router=require("express").Router();

const auth=require("../middleware/authMiddleware");

const controller=require("../controllers/storySeenController");

router.post(
"/:id",
auth,
controller.storySeen
);

module.exports=router;