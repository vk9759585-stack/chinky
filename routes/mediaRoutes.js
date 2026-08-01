const router = require("express").Router();

const upload = require("../middleware/upload");

const auth = require("../middleware/authMiddleware");

const controller =
require("../controllers/mediaController");

router.post(

"/image",

auth,

upload.single("image"),

controller.uploadImage

);

router.post(

"/video",

auth,

upload.single("video"),

controller.uploadVideo

);

module.exports = router;