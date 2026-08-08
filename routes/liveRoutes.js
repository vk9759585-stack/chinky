const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/liveController");

router.post("/token", auth, controller.createZegoToken);

module.exports = router;
