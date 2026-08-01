const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
{
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    orderId:{
        type:String,
        required:true
    },

    paymentId:{
        type:String,
        default:""
    },

    amount:{
        type:Number,
        required:true
    },

    currency:{
        type:String,
        default:"INR"
    },

    status:{
        type:String,
        enum:[
            "created",
            "paid",
            "failed"
        ],
        default:"created"
    },

    purpose:{
        type:String,
        enum:[
            "wallet",
            "premium",
            "subscription",
            "coins"
        ]
    }

},
{
    timestamps:true
});

module.exports =
mongoose.model(
"Payment",
paymentSchema
);