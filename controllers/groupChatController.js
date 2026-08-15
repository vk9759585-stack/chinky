const GroupChat=require("../models/GroupChat");
const GroupMessage=require("../models/GroupMessage");
exports.create=async(req,res)=>{try{
 const members=[...new Set([String(req.user.id),...(req.body.members||[]).map(String)])];
 const group=await GroupChat.create({name:String(req.body.name||"New group").slice(0,80),owner:req.user.id,members,admins:[req.user.id]});
 res.status(201).json({success:true,data:group});
}catch(e){res.status(500).json({success:false,message:e.message});}};
exports.list=async(req,res)=>{try{
 const rows=await GroupChat.find({members:req.user.id}).sort({updatedAt:-1}).lean();
 res.json({success:true,data:rows});
}catch(e){res.status(500).json({success:false,message:e.message});}};
exports.messages=async(req,res)=>{try{
 const group=await GroupChat.findOne({_id:req.params.id,members:req.user.id});
 if(!group)return res.status(404).json({success:false,message:"Group not found"});
 const rows=await GroupMessage.find({group:group._id}).populate("sender","username name profileImage").sort({createdAt:-1}).limit(100).lean();
 res.json({success:true,data:rows.reverse()});
}catch(e){res.status(500).json({success:false,message:e.message});}};
exports.send=async(req,res)=>{try{
 const group=await GroupChat.findOne({_id:req.params.id,members:req.user.id});
 if(!group)return res.status(404).json({success:false,message:"Group not found"});
 const row=await GroupMessage.create({group:group._id,sender:req.user.id,message:String(req.body.message||"").slice(0,5000),type:req.body.type||"text",media:req.body.media||"",seenBy:[req.user.id]});
 const io=req.app.get("io");
 if(io){for(const member of group.members){if(String(member)!==String(req.user.id))io.to(`user:${member}`).emit("group:message",{groupId:String(group._id),message:row});}}
 res.status(201).json({success:true,data:row});
}catch(e){res.status(500).json({success:false,message:e.message});}};
