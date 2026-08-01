const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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
        default: 0
    },

    active: {
        type: Boolean,
        default: true
    },

    startDate: {
        type: Date,
        default: Date.now
    },

    expiryDate: Date

},
{
    timestamps: true
}
);

module.exports = mongoose.model(
    "Subscription",
    subscriptionSchema
);