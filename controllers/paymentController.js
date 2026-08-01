const razorpay =
require("../config/razorpay");

exports.createOrder =
async(req,res)=>{

    try{

        const order =
        await razorpay.orders.create({

            amount:req.body.amount*100,

            currency:"INR"

        });

        res.json({

            success:true,

            order

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};