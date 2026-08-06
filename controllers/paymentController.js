const razorpay = require("../config/razorpay");

// ======================================
// CREATE ORDER
// ======================================

exports.createOrder = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            order
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};