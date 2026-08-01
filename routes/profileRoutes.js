const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/profileController");

router.get("/", auth, controller.getProfile);

module.exports = router;