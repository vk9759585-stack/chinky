const mongoose=require("mongoose");
const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:80},
  owner:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  members:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  admins:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  image:{type:String,default:""},
},{timestamps:true});
schema.index({members:1,updatedAt:-1});
module.exports=mongoose.models.GroupChat||mongoose.model("GroupChat",schema);
