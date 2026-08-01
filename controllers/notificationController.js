const Notification =
require("../models/Notification");

exports.createNotification =
async(req,res)=>{

    try{

        const notification =
        await Notification.create({

            sender:req.user.id,

            receiver:req.body.receiver,

            type:req.body.type,

            title:req.body.title,

            body:req.body.body,

            image:req.body.image

        });

        res.status(201).json({

            success:true,

            data:notification

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getNotifications =
async(req,res)=>{

    try{

        const notifications =
        await Notification.find({

            receiver:req.user.id

        })

        .populate(

            "sender",

            "username profileImage verified"

        )

        .sort({

            createdAt:-1

        });

        res.json({

            success:true,

            data:notifications

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.markRead =
async(req,res)=>{

    try{

        await Notification.findByIdAndUpdate(

            req.params.id,

            {

                isRead:true

            }

        );

        res.json({

            success:true

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};