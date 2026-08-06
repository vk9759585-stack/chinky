const mongoose = require("mongoose");

const storySeenSchema = new mongoose.Schema(
    {
        story: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Story",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

storySeenSchema.index(
    {
        story: 1,
        user: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "StorySeen",
    storySeenSchema
);