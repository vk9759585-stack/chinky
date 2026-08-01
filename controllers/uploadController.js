exports.uploadMedia=async(req,res)=>{

    try{

        if(!req.file){

            return res.status(400).json({

                success:false,

                message:"No file uploaded"

            });

        }

        res.json({

            success:true,

            file:req.file.filename,

            path:"/uploads/"+req.file.filename

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};