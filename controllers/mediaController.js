const cloudinary = require("../config/cloudinary");

exports.uploadImage = async (req, res) => {

    try {

        const result = await cloudinary.uploader.upload(

            req.file.path,

            {

                folder: "chinky/images"

            }

        );

        res.json({

            success: true,

            url: result.secure_url,

            publicId: result.public_id

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

exports.uploadVideo = async (req, res) => {

    try {

        const result = await cloudinary.uploader.upload(

            req.file.path,

            {

                resource_type: "video",

                folder: "chinky/videos"

            }

        );

        res.json({

            success: true,

            url: result.secure_url,

            publicId: result.public_id

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};