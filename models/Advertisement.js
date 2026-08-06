const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        image: {
            type: String,
            required: true
        },

        link: {
            type: String,
            default: ""
        },

        advertiser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        clicks: {
            type: Number,
            default: 0
        },

        impressions: {
            type: Number,
            default: 0
        },

        budget: {
            type: Number,
            default: 0
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Advertisement",
    advertisementSchema
);