const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, max: 10 },
  unitPricePaise: { type: Number, required: true, min: 1 },
}, { _id: false });

const shopOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [itemSchema], required: true },
  amountPaise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  shippingAddress: {
    fullName: String, phone: String, line1: String, line2: String,
    city: String, state: String, pincode: String,
  },
  status: { type: String, enum: ['payment_pending','paid','processing','shipped','delivered','cancelled','payment_failed'], default: 'payment_pending', index: true },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.models.ShopOrder || mongoose.model('ShopOrder', shopOrderSchema);
