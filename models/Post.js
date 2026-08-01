const mongoose=require("mongoose");

const postSchema=new mongoose.Schema({

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

image:String,

caption:String,

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
}

},{
timestamps:true
});

module.exports=mongoose.model("Post",postSchema);