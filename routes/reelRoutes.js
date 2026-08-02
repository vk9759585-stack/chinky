const router=require("express").Router();

const auth=require("../middleware/authMiddleware");
const upload=require("../config/multerConfig");

const controller=require("../controllers/reelController");

router.post(

"/",

auth,

upload.single("video"),

controller.uploadReel

);

router.get(

"/",

auth,

controller.getReels

);

router.put(
    "/like/:id",
    auth,
    controller.likeReel
);

router.put(
    "/save/:id",
    auth,
    controller.saveReel
);

router.put(
    "/view/:id",
    auth,
    controller.addView
);

router.put(
    "/share/:id",
    auth,
    controller.shareReel
);

module.exports=router;