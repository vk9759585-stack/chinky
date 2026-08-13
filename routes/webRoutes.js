const router = require("express").Router();

const web = require("../controllers/webController");
const profile = require("../controllers/profileController");
const posts = require("../controllers/postController");
const likes = require("../controllers/likeController");
const sparks = require("../controllers/sparkController");
const chats = require("../controllers/chatController");

router.post("/auth/login", web.sameOrigin, web.login);
router.get("/auth/session", web.browserAuth, web.session);
router.post("/auth/logout", web.sameOrigin, web.logout);
router.post("/waitlist", web.sameOrigin, web.joinWaitlist);

router.get("/spark/:id", web.sparkSharePage);
router.get("/p/:id", web.postSharePage);
router.get("/vibes/:id", web.vibesSharePage);
router.get("/@:username", web.profileSharePage);

router.get("/web/profile", web.browserAuth, profile.getProfile);
router.get("/web/feed", web.browserAuth, posts.getFlow);
router.get("/web/sparks", web.browserAuth, sparks.getSparks);
router.get("/web/conversations", web.browserAuth, chats.getConversations);

router.post("/web/flow/:id/like", web.sameOrigin, web.browserAuth, likes.likePost);
router.post("/web/flow/:id/save", web.sameOrigin, web.browserAuth, posts.toggleSavePost);
router.put("/web/sparks/:id/like", web.sameOrigin, web.browserAuth, sparks.likeSpark);
router.put("/web/sparks/:id/save", web.sameOrigin, web.browserAuth, sparks.saveSpark);

module.exports = router;
