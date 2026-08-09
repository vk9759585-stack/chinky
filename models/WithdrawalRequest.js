const mongoose=require('mongoose');
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},coins:{type:Number,required:true,min:1},amountPaise:{type:Number,required:true,min:1},upiId:{type:String,required:true},status:{type:String,enum:['pending','approved','rejected','paid'],default:'pending',index:true},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewedAt:Date},{timestamps:true});
schema.index({user:1,createdAt:-1});
module.exports=mongoose.model('WithdrawalRequest',schema);
