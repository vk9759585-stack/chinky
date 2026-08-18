const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/creatorFeaturesController");

router.get("/analytics", auth, c.analytics);

router.post("/live/schedule", auth, c.scheduleLive);
router.get("/live/schedule", auth, c.listScheduled);

router.get("/safety", auth, c.getSafety);
router.put("/safety", auth, c.saveSafety);

module.exports = router;
