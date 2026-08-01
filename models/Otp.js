const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
{
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    email:{
        type:String,
        required:true
    },

    otp:{
        type:String,
        required:true
    },

    purpose:{
        type:String,
        enum:[
            "register",
            "login",
            "forgot_password",
            "change_email"
        ],
        default:"login"
    },

    expiresAt:{
        type:Date,
        required:true
    }

},
{
    timestamps:true
}
);

module.exports = mongoose.model(
    "Otp",
    otpSchema
);