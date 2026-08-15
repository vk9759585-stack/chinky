const mongoose=require("mongoose");
const schema=new mongoose.Schema({
  group:{type:mongoose.Schema.Types.ObjectId,ref:"GroupChat",required:true,index:true},
  sender:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  message:{type:String,default:"",trim:true},
  type:{type:String,enum:["text","image","video","voice","file"],default:"text"},
  media:{type:String,default:""},
  seenBy:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
},{timestamps:true});
schema.index({group:1,createdAt:-1});
module.exports=mongoose.models.GroupMessage||mongoose.model("GroupMessage",schema);
