const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        plan: {
            type: String,
            enum: [
                "free",
                "silver",
                "gold",
                "platinum"
            ],
            default: "free"
        },

        price: {
            type: Number,
            default: 0,
            min: 0
        },

        active: {
            type: Boolean,
            default: true
        },

        startDate: {
            type: Date,
            default: Date.now
        },

        expiryDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Subscription",
    subscriptionSchema
);
