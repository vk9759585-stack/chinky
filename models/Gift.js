const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        giftName: {
            type: String,
            required: true,
            trim: true
        },

        giftImage: {
            type: String,
            default: ""
        },

        coins: {
            type: Number,
            default: 0,
            min: 0
        },

        message: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "pending",
                "completed",
                "failed"
            ],
            default: "completed"
        }
    },
    {
        timestamps: true
    }
);

giftSchema.index({
    sender: 1
});

giftSchema.index({
    receiver: 1
});

module.exports = mongoose.model(
    "Gift",
    giftSchema
);