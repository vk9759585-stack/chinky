const router=require("express").Router();

const auth=require("../middleware/authMiddleware");

const upload=require("../middleware/upload");

const controller=require("../controllers/uploadController");

router.post(

"/",

auth,

upload.single("file"),

controller.uploadMedia

);

module.exports=router;