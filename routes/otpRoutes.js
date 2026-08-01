const router=require("express").Router();

const controller=require("../controllers/otpController");

router.post(
    "/generate",
    controller.generateOtp
);

router.post(
    "/verify",
    controller.verifyOtp
);

module.exports=router;