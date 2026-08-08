const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/supportController");
router.post("/feedback", auth, controller.submitFeedback);
module.exports = router;
