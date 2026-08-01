const Call = require("../models/Call");

// Start Call
exports.startCall = async (req, res) => {

    try {

        const call = await Call.create({

            caller: req.user.id,

            receiver: req.body.receiverId,

            type: req.body.type || "voice",

            status: "calling"

        });

        res.status(201).json({

            success: true,

            data: call

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// Accept Call
exports.acceptCall = async (req, res) => {

    try {

        const call = await Call.findByIdAndUpdate(

            req.params.id,

            {

                status: "accepted",

                startedAt: new Date()

            },

            {

                new: true

            }

        );

        res.json({

            success: true,

            data: call

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// End Call
exports.endCall = async (req, res) => {

    try {

        const call = await Call.findById(req.params.id);

        call.status = "ended";

        call.endedAt = new Date();

        call.duration = Math.floor(
            (call.endedAt - call.startedAt) / 1000
        );

        await call.save();

        res.json({

            success: true,

            data: call

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};