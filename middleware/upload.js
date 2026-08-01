const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination(req,file,cb){

        cb(null,"uploads/");

    },

    filename(req,file,cb){

        const name =
            Date.now() +
            "-" +
            Math.round(Math.random()*1E9);

        cb(

            null,

            name +

            path.extname(file.originalname)

        );

    }

});

const fileFilter=(req,file,cb)=>{

    const allowed=[

        "image/jpeg",

        "image/png",

        "image/webp",

        "video/mp4",

        "video/quicktime",

        "audio/mpeg",

        "audio/mp3"

    ];

    if(allowed.includes(file.mimetype)){

        cb(null,true);

    }else{

        cb(

            new Error("Unsupported file type")

        );

    }

};

module.exports=multer({

    storage,

    limits:{

        fileSize:1024*1024*100 //100MB

    },

    fileFilter

});