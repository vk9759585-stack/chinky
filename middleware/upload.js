const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================
// CREATE UPLOAD DIRECTORY
// ======================================

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

// ======================================
// STORAGE
// ======================================

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename(req, file, cb) {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9);

        cb(
            null,
            uniqueName +
                path.extname(file.originalname)
        );
    }
});

// ======================================
// FILE FILTER
// ======================================

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Unsupported file type: ${file.mimetype}`
            ),
            false
        );
    }
};

// ======================================
// MULTER EXPORT
// ======================================

module.exports = multer({
    storage,

    limits: {
        fileSize: 1024 * 1024 * 100
    },

    fileFilter
});
