const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
{
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    emoji:{
        type:String,
        default:"❤️"
    }

},
{
    _id:false
});

const chatSchema = new mongoose.Schema(

{

    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    message:{
        type:String,
        default:""
    },

    type:{
        type:String,
        enum:[
            "text",
            "image",
            "voice",
            "video",
            "file",
            "location",
            "contact"
        ],
        default:"text"
    },

    image:{
        type:String,
        default:""
    },

    voice:{
        type:String,
        default:""
    },

    video:{
        type:String,
        default:""
    },

    file:{
        type:String,
        default:""
    },

    location:{

        latitude:Number,

        longitude:Number

    },

    contact:{

        name:String,

        phone:String

    },

    replyTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat",
        default:null
    },

    forwarded:{
        type:Boolean,
        default:false
    },

    edited:{
        type:Boolean,
        default:false
    },

    pinned:{
        type:Boolean,
        default:false
    },

    sent:{
        type:Boolean,
        default:true
    },

    delivered:{
        type:Boolean,
        default:false
    },

    seen:{
        type:Boolean,
        default:false
    },

    seenAt:{
        type:Date
    },

    reactions:[reactionSchema],

    deletedFor:[

        {

            type:mongoose.Schema.Types.ObjectId,

            ref:"User"

        }

    ],

    deletedForEveryone:{
        type:Boolean,
        default:false
    }

},

{

timestamps:true

}

);

chatSchema.index({

sender:1,

receiver:1,

createdAt:1

});

module.exports=mongoose.model(
"Chat",
chatSchema
);