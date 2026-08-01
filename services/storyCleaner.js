const Story=require("../models/Story");

const cron=require("node-cron");

cron.schedule("* * * * *",async()=>{

await Story.deleteMany({

expiresAt:{

$lt:new Date()

}

});

});