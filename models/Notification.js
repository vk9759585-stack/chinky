const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
{
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    type:{
        type:String,
        enum:[
            "like",
            "comment",
            "follow",
            "message",
            "call",
            "live",
            "mention",
            "reel_like",
            "story_like"
        ]
    },

    title:{
        type:String,
        default:""
    },

    body:{
        type:String,
        default:""
    },

    image:{
        type:String,
        default:""
    },

    isRead:{
        type:Boolean,
        default:false
    }

},
{
    timestamps:true
});

module.exports =
mongoose.model(
"Notification",
notificationSchema
);