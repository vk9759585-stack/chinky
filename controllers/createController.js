// =====================================
// CREATE MEDIA
// =====================================

exports.createMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const media = {
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: "/uploads/" + req.file.filename,
            uploadedAt: new Date()
        };

        return res.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            data: media
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};