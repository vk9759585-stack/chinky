const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/audioController");

router.get("/", auth, controller.list);
router.get("/:id", auth, controller.getOne);
router.post("/from-spark/:sparkId", auth, controller.ensureFromSpark);
router.put("/:id/save", auth, controller.setSaved);
router.post("/:id/use", auth, controller.recordUse);

module.exports = router;
