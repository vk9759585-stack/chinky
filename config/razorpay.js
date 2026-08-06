const Razorpay = require("razorpay");

// Validate environment variables
if (!process.env.RAZORPAY_KEY || !process.env.RAZORPAY_SECRET) {
  throw new Error("Razorpay environment variables are missing");
}

// Create instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Optional: Log in development
if (process.env.NODE_ENV !== "production") {
  console.log("✅ Razorpay initialized");
}

module.exports = razorpay;