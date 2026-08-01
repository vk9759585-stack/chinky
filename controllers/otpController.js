const Otp = require("../models/Otp");

// Generate OTP
exports.generateOtp = async (req, res) => {

    try {

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const expires = new Date(
            Date.now() + 5 * 60 * 1000
        );

        await Otp.create({

            email: req.body.email,

            otp,

            purpose: req.body.purpose,

            expiresAt: expires

        });

        // TODO:
        // Send OTP using Email/SMS provider

        res.json({

            success:true,

            otp

        });

    } catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

// Verify OTP
exports.verifyOtp = async (req,res)=>{

    try{

        const record = await Otp.findOne({

            email:req.body.email,

            otp:req.body.otp

        });

        if(!record){

            return res.status(400).json({

                success:false,

                message:"Invalid OTP"

            });

        }

        if(record.expiresAt < new Date()){

            return res.status(400).json({

                success:false,

                message:"OTP Expired"

            });

        }

        await Otp.deleteOne({

            _id:record._id

        });

        res.json({

            success:true

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};