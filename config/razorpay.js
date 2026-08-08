const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY?.trim();
const keySecret = process.env.RAZORPAY_SECRET?.trim();

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