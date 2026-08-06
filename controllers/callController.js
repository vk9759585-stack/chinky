const Call = require("../models/Call");

// ======================================
// START CALL
// ======================================

exports.startCall = async (req, res) => {
    try {
        const call = await Call.create({
            caller: req.user.id,
            receiver: req.body.receiverId,
            type: req.body.type || "voice",
            status: "calling",
            createdAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Call started successfully",
            data: call
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// ACCEPT CALL
// ======================================

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

        if (!call) {
            return res.status(404).json({
                success: false,
                message: "Call not found"
            });
        }

        return res.json({
            success: true,
            data: call
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// REJECT CALL
// ======================================

exports.rejectCall = async (req, res) => {
    try {
        const call = await Call.findByIdAndUpdate(
            req.params.id,
            {
                status: "rejected"
            },
            {
                new: true
            }
        );

        return res.json({
            success: true,
            data: call
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// END CALL
// ======================================

exports.endCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);

        if (!call) {
            return res.status(404).json({
                success: false,
                message: "Call not found"
            });
        }

        call.status = "ended";
        call.endedAt = new Date();

        if (call.startedAt) {
            call.duration = Math.floor(
                (call.endedAt - call.startedAt) / 1000
            );
        }

        await call.save();

        return res.json({
            success: true,
            data: call
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ======================================
// CALL HISTORY
// ======================================

exports.getCallHistory = async (req, res) => {
    try {
        const calls = await Call.find({
            $or: [
                { caller: req.user.id },
                { receiver: req.user.id }
            ]
        })
            .populate("caller", "username name profilePic")
            .populate("receiver", "username name profilePic")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            data: calls
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
