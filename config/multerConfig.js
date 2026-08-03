const multer = require("multer");

const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, uploadDirectory);

    },

    filename(req, file, cb) {

        cb(

            null,

            Date.now() +

            path.extname(file.originalname)

        );

    }

});

module.exports = multer({

    storage

});
