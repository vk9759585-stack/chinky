const Razorpay = require("razorpay");

const keyId = String(
  process.env.RAZORPAY_KEY ||
  process.env.RAZORPAY_KEY_ID ||
  ''
).trim();

const keySecret = String(
  process.env.RAZORPAY_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  ''
).trim();

if (!keyId || !keySecret) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Razorpay disabled: set RAZORPAY_KEY and RAZORPAY_SECRET to enable payments.");
  }
  module.exports = null;
  return;
}

// Create instance
const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// Optional: Log in development
if (process.env.NODE_ENV !== "production") {
  console.log("Razorpay initialized");
}

module.exports = razorpay;