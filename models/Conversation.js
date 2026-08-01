const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(

    {

        members: [

            {

                type: mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true

            }

        ],

        lastMessage: {

            type: String,

            default: ""

        },

        lastMessageType: {

            type: String,

            enum: [

                "text",

                "image",

                "video",

                "audio"

            ],

            default: "text"

        },

        lastSender: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User"

        },

        unreadCount: {

            type: Number,

            default: 0

        }

    },

    {

        timestamps: true

    }

);

module.exports = mongoose.model(

    "Conversation",

    conversationSchema

);