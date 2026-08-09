const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/supportController");
router.get("/help", auth, controller.help);
router.get("/tickets", auth, controller.myTickets);
router.post("/tickets", auth, controller.createTicket);
router.post("/feedback", auth, controller.submitFeedback);
module.exports = router;
