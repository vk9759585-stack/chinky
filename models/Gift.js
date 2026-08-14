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

        sourceType: { type: String, enum: ['live', 'spark'], required: true, default: 'spark' },

        sourceId: { type: String, required: true, default: '' },

        creatorShareCoins: { type: Number, default: 0, min: 0 },

        platformShareCoins: { type: Number, default: 0, min: 0 },

        effectKey: { type: String, default: 'pop', trim: true, maxlength: 40 },

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

giftSchema.index({ sourceType: 1, sourceId: 1, createdAt: -1 });

module.exports = mongoose.model(
    "Gift",
    giftSchema
);
