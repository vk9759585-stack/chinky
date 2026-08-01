const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/chatController");

router.post("/send", auth, controller.sendMessage);

router.get("/:userId", auth, controller.getMessages);

router.put("/seen/:id", auth, controller.markSeen);

router.put("/edit/:id", auth, controller.editMessage);

router.put("/pin/:id", auth, controller.pinMessage);

router.post("/reply", auth, controller.replyMessage);

router.post("/forward/:id", auth, controller.forwardMessage);

router.post("/reaction/:id", auth, controller.addReaction);

router.delete("/reaction/:id", auth, controller.removeReaction);

router.delete("/me/:id", auth, controller.deleteForMe);

router.delete("/everyone/:id", auth, controller.deleteForEveryone);

router.get("/search/messages", auth, controller.searchMessages);

router.get("/stats/summary", auth, controller.chatStats);

module.exports = router;