const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        orderId: {
            type: String,
            required: true,
            trim: true
        },

        paymentId: {
            type: String,
            default: ""
        },

        signature: {
            type: String,
            default: ""
        },

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        currency: {
            type: String,
            default: "INR"
        },

        status: {
            type: String,
            enum: [
                "created",
                "paid",
                "failed",
                "refunded"
            ],
            default: "created"
        },

        purpose: {
            type: String,
            enum: [
                "wallet",
                "premium",
                "subscription",
                "coins"
            ],
            required: true
        },

        gateway: {
            type: String,
            default: "razorpay"
        },

        description: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

paymentSchema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Payment",
    paymentSchema
);