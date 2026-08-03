const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    caption:{
        type:String,
        default:""
    },

    video:{
        type:String,
        required:true
    },

    thumbnail:{
        type:String,
        default:""
    },

    music:{
        type:String,
        default:""
    },

    filter:{
        type:String,
        default:"Original"
    },

    duration:{
        type:Number,
        default:0
    },

    hashtags:[
        String
    ],

    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],

    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        }
    ],

    shares:{
        type:Number,
        default:0
    },

    views:{
        type:Number,
        default:0
    },

    saves:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],

    isTrending:{
        type:Boolean,
        default:false
    }

},
{
    timestamps:true
});

module.exports=mongoose.model(
    "Reel",
    reelSchema
);
