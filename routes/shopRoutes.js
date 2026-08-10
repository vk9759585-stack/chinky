const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/authMiddleware');
const razorpay = require('../config/razorpay');
const ShopOrder = require('../models/ShopOrder');

const router = express.Router();
router.use(auth);

const PRODUCTS = Object.freeze({
  creator_light_mini: { name: 'Creator Light Mini', category: 'Electronics', pricePaise: 129900 },
  wireless_creator_mic: { name: 'Wireless Creator Mic', category: 'Electronics', pricePaise: 189900 },
  glow_care_kit: { name: 'Glow Care Kit', category: 'Beauty', pricePaise: 69900 },
  daily_wellness_set: { name: 'Daily Wellness Set', category: 'Health & Personal Care', pricePaise: 89900 },
  everyday_sling_bag: { name: 'Everyday Sling Bag', category: "Women's Fashion", pricePaise: 79900 },
  mobile_stand_pro: { name: 'Mobile Stand Pro', category: 'Electronics', pricePaise: 49900 },
});

router.get('/products', (req, res) => res.json({ success: true, data: Object.entries(PRODUCTS).map(([id,p]) => ({ id, ...p })) }));

router.post('/checkout/order', async (req, res, next) => {
  try {
    if (!razorpay) return res.status(503).json({ success:false, message:'Payments are temporarily unavailable' });
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    const a = req.body.shippingAddress || {};
    if (!rawItems.length || !a.fullName || !a.phone || !a.line1 || !a.city || !a.state || !/^\d{6}$/.test(String(a.pincode || ''))) {
      return res.status(400).json({ success:false, message:'Valid items and delivery address are required' });
    }
    const items = [];
    let amountPaise = 0;
    for (const raw of rawItems) {
      const product = PRODUCTS[String(raw.productId || '')];
      const quantity = Math.max(1, Math.min(10, Number.parseInt(raw.quantity, 10) || 1));
      if (!product) return res.status(400).json({ success:false, message:'Invalid product' });
      items.push({ productId: raw.productId, name: product.name, quantity, unitPricePaise: product.pricePaise });
      amountPaise += product.pricePaise * quantity;
    }
    // Amount is always calculated on the server; never trust a client-supplied price.
    const rpOrder = await razorpay.orders.create({ amount: amountPaise, currency:'INR', receipt:`shop_${Date.now()}`, notes:{ userId:String(req.user.id), type:'shop' } });
    const order = await ShopOrder.create({ user:req.user.id, items, amountPaise, shippingAddress:{ fullName:String(a.fullName).trim(), phone:String(a.phone).trim(), line1:String(a.line1).trim(), line2:String(a.line2||'').trim(), city:String(a.city).trim(), state:String(a.state).trim(), pincode:String(a.pincode).trim() }, razorpayOrderId:rpOrder.id });
    return res.status(201).json({ success:true, key:process.env.RAZORPAY_KEY, data:{ shopOrderId:order.id, razorpayOrderId:rpOrder.id, amountPaise, currency:'INR' } });
  } catch (e) { next(e); }
});

router.post('/checkout/verify', async (req, res, next) => {
  try {
    const { shopOrderId, razorpayOrderId, razorpayPaymentId, signature } = req.body;
    const order = await ShopOrder.findOne({ _id:shopOrderId, user:req.user.id });
    if (!order || order.razorpayOrderId !== razorpayOrderId) return res.status(404).json({ success:false, message:'Order not found' });
    if (order.status === 'paid' || order.status === 'processing') return res.json({ success:true, data:order });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    const a = Buffer.from(expected); const b = Buffer.from(String(signature || ''));
    if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) {
      order.status = 'payment_failed'; await order.save();
      return res.status(400).json({ success:false, message:'Payment verification failed' });
    }
    // Verify amount/currency/status with Razorpay before fulfilling the order.
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (!payment || payment.order_id !== razorpayOrderId || payment.currency !== 'INR' || Number(payment.amount) !== order.amountPaise || !['captured','authorized'].includes(payment.status)) {
      order.status = 'payment_failed'; await order.save();
      return res.status(400).json({ success:false, message:'Payment details do not match the order' });
    }
    order.status = 'paid'; order.razorpayPaymentId = razorpayPaymentId; order.paidAt = new Date(); await order.save();
    return res.json({ success:true, data:order });
  } catch (e) { next(e); }
});

router.get('/orders', async (req, res, next) => {
  try { const orders = await ShopOrder.find({ user:req.user.id }).sort({ createdAt:-1 }).limit(100).lean(); res.json({ success:true, data:orders }); } catch(e){ next(e); }
});

module.exports = router;
