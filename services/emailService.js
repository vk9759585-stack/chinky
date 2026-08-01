const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL,

        pass: process.env.EMAIL_PASSWORD

    }

});

exports.sendOtp = async (

    email,

    otp

) => {

    await transporter.sendMail({

        from: process.env.EMAIL,

        to: email,

        subject: "Chinky OTP",

        html: `<h2>Your OTP is ${otp}</h2>`

    });

};