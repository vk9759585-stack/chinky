const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require(
    "../controllers/notificationController"
);

// ====================================
// CREATE NOTIFICATION
// ====================================

router.post(
    "/",
    auth,
    controller.createNotification
);

// ====================================
// GET NOTIFICATIONS
// ====================================

router.get(
    "/",
    auth,
    controller.getNotifications
);

// ====================================
// MARK AS READ
// ====================================

router.put(
    "/read/:id",
    auth,
    controller.markRead
);

module.exports = router;