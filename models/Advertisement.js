const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
{
    title: String,

    image: String,

    link: String,

    clicks: {
        type: Number,
        default: 0
    },

    impressions: {
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