const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/callController");

// ===================================
// START CALL
// ===================================

router.post(
    "/start",
    auth,
    controller.startCall
);

// ===================================
// ACCEPT CALL
// ===================================

router.put(
    "/accept/:id",
    auth,
    controller.acceptCall
);

// ===================================
// END CALL
// ===================================

router.put(
    "/end/:id",
    auth,
    controller.endCall
);

// ===================================
// REJECT CALL
// ===================================

router.put(
    "/reject/:id",
    auth,
    controller.rejectCall
);

// ===================================
// CALL HISTORY
// ===================================

router.get(
    "/history",
    auth,
    controller.getCallHistory
);

module.exports = router;