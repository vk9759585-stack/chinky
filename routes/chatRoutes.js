const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const controller = require("../controllers/chatController");

// ====================================
// SEND MESSAGE
// ====================================

router.post(
    "/send",
    auth,
    controller.sendMessage
);

// Upload attachments before sending a chat message. The response contains the
// URL that can be passed as image, video, voice, or file to /send.
router.post("/upload-image", auth, upload.single("image"), controller.uploadAttachment);
router.post("/upload-video", auth, upload.single("video"), controller.uploadAttachment);
router.post("/upload-voice", auth, upload.single("voice"), controller.uploadAttachment);
router.post("/upload-file", auth, upload.single("file"), controller.uploadAttachment);

// ====================================
// CONVERSATIONS
// ====================================

router.get(
    "/conversations",
    auth,
    controller.getConversations
);

// ====================================
// SEARCH
// ====================================

router.get(
    "/search/messages",
    auth,
    controller.searchMessages
);

// ====================================
// STATISTICS
// ====================================

router.get(
    "/stats/summary",
    auth,
    controller.chatStats
);

// ====================================
// REPLY
// ====================================

router.post(
    "/reply",
    auth,
    controller.replyMessage
);

// ====================================
// FORWARD MESSAGE
// ====================================

router.post(
    "/forward/:id",
    auth,
    controller.forwardMessage
);

// ====================================
// REACTIONS
// ====================================

router.post(
    "/reaction/:id",
    auth,
    controller.addReaction
);

router.delete(
    "/reaction/:id",
    auth,
    controller.removeReaction
);

// ====================================
// MESSAGE STATUS
// ====================================

router.put(
    "/seen/:id",
    auth,
    controller.markSeen
);

router.put(
    "/edit/:id",
    auth,
    controller.editMessage
);

router.put(
    "/pin/:id",
    auth,
    controller.pinMessage
);

// ====================================
// DELETE MESSAGE
// ====================================

router.delete(
    "/me/:id",
    auth,
    controller.deleteForMe
);

router.delete(
    "/everyone/:id",
    auth,
    controller.deleteForEveryone
);

router.post("/report/:id", auth, controller.reportMessage);

// Backwards-compatible endpoint used by the Flutter chat service.
router.delete("/:id", auth, controller.deleteForMe);

// ====================================
// PRESENCE
// ====================================
router.get("/presence/:userId", auth, controller.getPresence);

// ====================================
// GET CHAT
// ====================================

router.get(
    "/:userId",
    auth,
    controller.getMessages
);

module.exports = router;
