const router =
require("express").Router();

const auth =
require("../middleware/authMiddleware");

const controller =
require("../controllers/notificationController");

router.post(
"/",
auth,
controller.createNotification
);

router.get(
"/",
auth,
controller.getNotifications
);

router.put(
"/read/:id",
auth,
controller.markRead
);

module.exports=router;