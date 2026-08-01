const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require("../controllers/callController");

router.post(
    "/start",
    auth,
    controller.startCall
);

router.put(
    "/accept/:id",
    auth,
    controller.acceptCall
);

router.put(
    "/end/:id",
    auth,
    controller.endCall
);

module.exports = router;