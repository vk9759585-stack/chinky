const ReelComment=require("../models/ReelComment");

exports.addComment=async(req,res)=>{

    try{

        const comment=await ReelComment.create({

            reel:req.body.reelId,

            user:req.user.id,

            comment:req.body.comment

        });

        res.status(201).json({

            success:true,

            data:comment

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getComments=async(req,res)=>{

    try{

        const comments=await ReelComment.find({

            reel:req.params.id

        }).populate(

            "user",

            "username profileImage"

        );

        res.json({

            success:true,

            data:comments

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};