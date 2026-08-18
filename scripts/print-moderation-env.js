const crypto = require("crypto");
console.log("CHINKY_CONTENT_MODERATION=on");
console.log("CHINKY_PUBLIC_API_URL=https://YOUR-BACKEND-SERVICE.example.com");
console.log("CHINKY_MODERATION_WEBHOOK_TOKEN=" + crypto.randomBytes(32).toString("hex"));
console.log("CHINKY_IMAGE_MODERATION=aws_rek:explicit_nudity:0.65:suggestive:0.82");
console.log("CHINKY_VIDEO_MODERATION=aws_rek_video:explicit_nudity:0.65:suggestive:0.82");
