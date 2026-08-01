const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(

    {

        conversation: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Conversation",

            required: true

        },

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

        message: {

            type: String,

            default: ""

        },

        image: {

            type: String,

            default: ""

        },

        video: {

            type: String,

            default: ""

        },

        audio: {

            type: String,

            default: ""

        },

        messageType: {

            type: String,

            enum: [

                "text",

                "image",

                "video",

                "audio"

            ],

            default: "text"

        },

        seen: {

            type: Boolean,

            default: false

        }

    },

    {

        timestamps: true

    }

);

module.exports = mongoose.model(

    "Message",

    messageSchema

);