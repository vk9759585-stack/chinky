const Call = require("../models/Call");

// ======================================
// START CALL
// ======================================

exports.startCall = async (req, res) => {
    try {
        const receiverId = String(req.body.receiverId || "");
        if (!receiverId) {
            return res.status(400).json({ success: false, message: "Receiver is required" });
        }
        if (receiverId === String(req.user.id)) {
            return res.status(400).json({ success: false, message: "You cannot call yourself" });
        }
        const active = await Call.findOne({
            status: { $in: ["calling", "ringing", "accepted"] },
            $or: [
                { caller: req.user.id, receiver: receiverId },
                { caller: receiverId, receiver: req.user.id }
            ]
        });
        if (active) {
            return res.status(409).json({ success: false, message: "A call is already active" });
        }
        const call = await Call.create({
            caller: req.user.id,
            receiver: receiverId,
            type: req.body.type === "video" ? "video" : "voice",
            status: "calling",
            createdAt: new Date()
        });

        call.status = "ringing";
        await call.save();

        const io = req.app.get("io");
        if (io) {
            const incoming = await Call.findById(call._id).populate("caller", "name username profileImage");
            io.to(`user:${receiverId}`).emit("call:incoming", incoming.toObject());
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
        const call = await Call.findOneAndUpdate(
            { _id: req.params.id, receiver: req.user.id, status: "calling" },
            { status: "accepted", startedAt: new Date() },
            { new: true }
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
        const call = await Call.findOneAndUpdate(
            { _id: req.params.id, receiver: req.user.id, status: "calling" },
            { status: "rejected", endedAt: new Date() },
            { new: true }
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
        const call = await Call.findOne({
            _id: req.params.id,
            $or: [{ caller: req.user.id }, { receiver: req.user.id }]
        });

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
        const missedBefore = new Date(Date.now() - 60 * 1000);
        await Call.updateMany(
            { receiver: req.user.id, status: "calling", createdAt: { $lt: missedBefore } },
            { $set: { status: "missed", endedAt: new Date() } }
        );
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
            data: calls.map((call) => ({
                ...call.toObject(),
                isCaller: String(call.caller?._id || call.caller) === String(req.user.id),
                otherUser: String(call.caller?._id || call.caller) === String(req.user.id) ? call.receiver : call.caller
            }))
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
