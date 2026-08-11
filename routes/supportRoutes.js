const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");
const controller = require("../controllers/supportController");

router.get("/admin/dashboard", auth, isAdmin, controller.adminDashboard);
router.get("/admin/tickets", auth, isAdmin, controller.adminTickets);
router.put("/admin/tickets/:id/status", auth, isAdmin, controller.adminUpdateStatus);
router.post("/admin/tickets/:id/reply", auth, isAdmin, controller.adminReply);

router.get("/help", auth, controller.help);
router.get("/assistant/identity", auth, controller.assistantIdentity);
router.post("/assistant", auth, controller.assistant);
router.get("/tickets", auth, controller.myTickets);
router.post("/tickets", auth, controller.createTicket);
router.get("/tickets/:id", auth, controller.getTicket);
router.post("/tickets/:id/messages", auth, controller.continueTicket);
router.put("/tickets/:id/status", auth, controller.updateMyTicketStatus);
router.post("/feedback", auth, controller.submitFeedback);

module.exports = router;
