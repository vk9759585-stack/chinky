const cloudinary = require("../config/cloudinary");

// =============================
// IMAGE UPLOAD
// =============================

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image not found"
            });
        }

        const result = await cloudinary.uploader.upload(
            req.file.path,
            {
                folder: "chinky/images"
            }
        );

        return res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// =============================
// VIDEO UPLOAD
// =============================

exports.uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Video not found"
            });
        }

        const result = await cloudinary.uploader.upload(
            req.file.path,
            {
                resource_type: "video",
                folder: "chinky/videos"
            }
        );

        return res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};