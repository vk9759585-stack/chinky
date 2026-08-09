const mongoose=require('mongoose');
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},packageId:{type:String,required:true},upiId:{type:String,required:true},amountPaise:{type:Number,required:true},coins:{type:Number,required:true},status:{type:String,enum:['pending','approved','rejected'],default:'pending',index:true},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewedAt:Date},{timestamps:true});
schema.index({user:1,createdAt:-1});
module.exports=mongoose.model('UpiCoinRequest',schema);
