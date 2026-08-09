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

        const io = req.app.get("io");
        if (io) {
            const incoming = await Call.findById(call._id).populate("caller", "name username profileImage");
            io.to(`user:${req.body.receiverId}`).emit("call:incoming", incoming.toObject());
        }

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

        const io = req.app.get("io");
        if (io) io.to(`user:${call.caller}`).emit("call:accepted", call.toObject());

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

        const io = req.app.get("io");
        if (io && call) io.to(`user:${call.caller}`).emit("call:rejected", call.toObject());

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

        const io = req.app.get("io");
        if (io) {
            io.to(`user:${call.caller}`).emit("call:ended", call.toObject());
            io.to(`user:${call.receiver}`).emit("call:ended", call.toObject());
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
