const admin =
require("../config/firebase");

exports.sendNotification =
async (

token,

title,

body

)=>{

    await admin.messaging().send({

        token,

        notification:{

            title,

            body

        }

    });

};