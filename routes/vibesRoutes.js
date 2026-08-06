const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const upload = require("../config/multerConfig");

const controller = require("../controllers/vibesController");

router.get(
    "/",
    auth,
controller.getVibes
);

router.post(
    "/upload",
    auth,
    upload.single("story"),
    controller.createVibes
);

router.delete('/:id', auth, controller.deleteVibes);

module.exports = router;
