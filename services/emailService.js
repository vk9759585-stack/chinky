const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter (important for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email transporter ready");
  }
});

// Send OTP function
exports.sendOtp = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Chinky App" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>OTP Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="color: #2e6cff;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

exports.sendSecurityEmail = async (email, subject, message) => {
  if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
    throw new Error("Email service is not configured");
  }
  await transporter.sendMail({
    from: `"CHINKY Security" <${process.env.EMAIL}>`,
    to: email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1d1d1f">
        <h2 style="margin-bottom:12px">CHINKY Security</h2>
        <p>${String(message || "").replace(/[<>&]/g, "")}</p>
        <p style="color:#666;font-size:13px">If this was not you, open CHINKY → Password and security → Where you're logged in.</p>
      </div>
    `,
  });
};
