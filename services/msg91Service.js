const https = require("https");

// Normalize Indian phone number
const normalizedPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  // Remove country code if already present
  const local =
    digits.startsWith("91") && digits.length === 12
      ? digits.slice(2)
      : digits;

  return /^[6-9]\d{9}$/.test(local) ? `91${local}` : null;
};

// Send OTP via MSG91
exports.sendOtp = async (phone, otp) => {
  const mobile = normalizedPhone(phone);

  if (!mobile) {
    throw new Error("Enter a valid 10-digit Indian mobile number");
  }

  if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_TEMPLATE_ID) {
    throw new Error("MSG91 is not configured on the server");
  }

  const payload = JSON.stringify({
    mobile,
    otp,
    template_id: process.env.MSG91_TEMPLATE_ID,
  });

  const options = {
    hostname: "control.msg91.com",
    path: "/api/v5/otp",
    method: "POST",
    headers: {
      authkey: process.env.MSG91_AUTH_KEY,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
    timeout: 10000, // 10 sec timeout
  };

  try {
    const response = await new Promise((resolve, reject) => {
      const request = https.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          let parsed;

          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = { message: body };
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(
              new Error(parsed.message || "MSG91 rejected the OTP request")
            );
          }

          resolve(parsed);
        });
      });

      request.on("error", (err) => {
        reject(new Error("Network error while sending OTP"));
      });

      request.on("timeout", () => {
        request.destroy();
        reject(new Error("MSG91 request timed out"));
      });

      request.write(payload);
      request.end();
    });

    console.log(`OTP sent successfully to ${mobile}`);
    return response;

  } catch (error) {
    console.error("OTP Send Error:", error.message);
    throw error;
  }
};

exports.normalizedPhone = normalizedPhone;