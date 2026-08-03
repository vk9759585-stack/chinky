const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/profileController");
const upload = require("../config/multerConfig");

router.get("/", auth, controller.getProfile);
router.put("/", auth, controller.updateProfile);
router.post("/upload", auth, upload.single("profile"), controller.uploadProfilePhoto);

module.exports = router;
