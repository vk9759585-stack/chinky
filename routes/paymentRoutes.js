const router=require("express").Router();

const auth=require("../middleware/authMiddleware");

const controller=
require("../controllers/paymentController");

router.post(
"/order",
auth,
controller.createOrder
);

module.exports=router;