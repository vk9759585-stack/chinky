const router = require("express").Router();

const auth =
require("../middleware/authMiddleware");

const controller =
require("../controllers/walletController");

router.get(
    "/",
    auth,
    controller.getWallet
);

router.put(
    "/coins",
    auth,
    controller.addCoins
);

module.exports = router;