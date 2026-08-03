const Reel=require("../models/Reel");
const cloudinary=require("../config/cloudinary");
const fs=require("fs");

// Upload Reel

exports.uploadReel=async(req,res)=>{

    try{

        if (!req.file) {
            return res.status(400).json({ success:false, message:"Reel video is required" });
        }

        let videoUrl;
        try {
            const upload=await cloudinary.uploader.upload(req.file.path,{
                resource_type:"video",
                folder:"chinky/reels"
            });
            videoUrl = upload.secure_url;
            await fs.promises.unlink(req.file.path).catch(()=>{});
        } catch (_) {
            videoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const reel=await Reel.create({

            user:req.user.id,

            caption:req.body.caption,

            video:videoUrl,

            thumbnail:req.body.thumbnail,

            music:req.body.music,

            filter:req.body.filter,

            duration:req.body.duration,

            hashtags:req.body.hashtags

        });

        res.status(201).json({

            success:true,

            data:reel

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

// Get All Reels

exports.getReels=async(req,res)=>{

    try{

        const reels=await Reel.find()

        .populate(

            "user",

            "username profileImage verified"

        )

        .sort({

            createdAt:-1

        });

        res.json({

            success:true,

            data:reels

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

// ===================================
// LIKE / UNLIKE REEL
// ===================================

exports.likeReel = async (req, res) => {

    try {

        const reel = await Reel.findById(req.params.id);

        if (!reel) {

            return res.status(404).json({

                success: false,

                message: "Reel not found"

            });

        }

        const userId = req.user.id;

        const index = reel.likes.findIndex(

            id => id.toString() === userId

        );

        if (index === -1) {

            reel.likes.push(userId);

        } else {

            reel.likes.splice(index, 1);

        }

        await reel.save();

        res.json({

            success: true,

            likes: reel.likes.length

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ===================================
// SAVE / UNSAVE REEL
// ===================================

exports.saveReel = async (req, res) => {

    try {

        const reel = await Reel.findById(req.params.id);

        const userId = req.user.id;

        const index = reel.saves.findIndex(

            id => id.toString() === userId

        );

        if (index === -1) {

            reel.saves.push(userId);

        } else {

            reel.saves.splice(index, 1);

        }

        await reel.save();

        res.json({

            success: true,

            saves: reel.saves.length

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ===================================
// VIEW COUNTER
// ===================================

exports.addView = async (req, res) => {

    try {

        const reel = await Reel.findById(req.params.id);

        reel.views++;

        await reel.save();

        res.json({

            success: true,

            views: reel.views

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ===================================
// SHARE COUNTER
// ===================================

exports.shareReel = async (req, res) => {

    try {

        const reel = await Reel.findById(req.params.id);

        reel.shares++;

        await reel.save();

        res.json({

            success: true,

            shares: reel.shares

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
