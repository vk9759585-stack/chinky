const Call = require("../models/Call");
const User = require("../models/User");
const { sendNotification } = require("../services/notificationService");
const { createSocialNotification } = require("../services/socialNotificationService");

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
        // Clear abandoned calls so a previously interrupted call cannot block
        // every future call between the same two users.
        const staleRingingBefore = new Date(Date.now() - 90 * 1000);
        const staleAcceptedBefore = new Date(Date.now() - 3 * 60 * 60 * 1000);
        await Call.updateMany(
            {
                status: { $in: ["calling", "ringing"] },
                createdAt: { $lt: staleRingingBefore },
                $or: [
                    { caller: req.user.id, receiver: receiverId },
                    { caller: receiverId, receiver: req.user.id }
                ]
            },
            { $set: { status: "missed", endedAt: new Date() } }
        );
        await Call.updateMany(
            {
                status: "accepted",
                updatedAt: { $lt: staleAcceptedBefore },
                $or: [
                    { caller: req.user.id, receiver: receiverId },
                    { caller: receiverId, receiver: req.user.id }
                ]
            },
            { $set: { status: "ended", endedAt: new Date() } }
        );

        const active = await Call.findOne({
            status: { $in: ["calling", "ringing", "accepted"] },
            $or: [
                { caller: req.user.id, receiver: receiverId },
                { caller: receiverId, receiver: req.user.id }
            ]
        });
        if (active) {
            // Reuse the caller's own still-active call. This makes Start Call
            // idempotent after a network retry instead of showing a false error.
            if (String(active.caller) === String(req.user.id)) {
                return res.status(200).json({
                    success: true,
                    message: "Existing call resumed",
                    data: active
                });
            }
            return res.status(409).json({ success: false, message: "An incoming call is already active" });
        }
        const call = await Call.create({
            caller: req.user.id,
            receiver: receiverId,
            type: req.body.type === "video" ? "video" : "voice",
            status: "calling",
            createdAt: new Date()
        });

        // Keep the caller in "Calling" until the receiver device/app
        // confirms that the incoming-call screen has actually been reached.
        // This prevents a fake ringback tone when the other device never got
        // the invitation.
        const io = req.app.get("io");
        const incoming = await Call.findById(call._id)
            .populate("caller", "name username profileImage");
        if (io && incoming) {
            io.to(`user:${receiverId}`).emit("call:incoming", incoming.toObject());
        }

        // Real device call alert when the receiver is backgrounded or the
        // socket is temporarily unavailable. The RTC room itself still starts
        // only after the receiver accepts.
        const receiver = await User.findById(receiverId)
            .select("fcmTokens")
            .lean()
            .catch(() => null);
        const caller = incoming?.caller;
        const callerName = String(
            caller?.username || caller?.name || "CHINKY user"
        );
        const callerImage = String(caller?.profileImage || "");
        // Keep the call visible in Activity/realtime notifications too.
        // Push is disabled here because the dedicated incoming_call push below
        // carries the callId and opens the actual call screen.
        createSocialNotification(req, {
            sender: req.user.id,
            receiver: receiverId,
            type: "call",
            title: req.body.type === "video" ? "Incoming video call" : "Incoming voice call",
            body: `${callerName} is calling you`,
            link: `/call/${call._id}`,
            push: false
        }).catch(() => {});

        if (receiver?.fcmTokens?.length) {
            sendNotification(
                receiver.fcmTokens,
                req.body.type === "video" ? "Incoming video call" : "Incoming voice call",
                `${callerName} is calling you`,
                {
                    type: "incoming_call",
                    callId: String(call._id),
                    callType: call.type,
                    username: callerName,
                    profileImage: callerImage
                },
                {
                    channelId: "chinky_calls",
                    ttlMs: 45 * 1000,
                    sound: true
                }
            ).catch(() => {});
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
// RECEIVER CONFIRMED RINGING
// ======================================
exports.markRinging = async (req, res) => {
    try {
        const call = await Call.findOneAndUpdate(
            { _id: req.params.id, receiver: req.user.id, status: "calling" },
            { status: "ringing" },
            { new: true }
        );
        if (!call) {
            const existing = await Call.findOne({
                _id: req.params.id,
                receiver: req.user.id,
                status: { $in: ["ringing", "accepted"] }
            });
            if (existing) return res.json({ success: true, data: existing });
            return res.status(404).json({ success: false, message: "Call not found" });
        }
        const io = req.app.get("io");
        if (io) io.to(`user:${call.caller}`).emit("call:ringing", call.toObject());
        return res.json({ success: true, data: call });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// ACCEPT CALL
// ======================================

exports.acceptCall = async (req, res) => {
    try {
        const call = await Call.findOneAndUpdate(
            { _id: req.params.id, receiver: req.user.id, status: { $in: ["calling", "ringing"] } },
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
            { _id: req.params.id, receiver: req.user.id, status: { $in: ["calling", "ringing"] } },
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

exports.missCall = async (req, res) => {
    try {
        const call = await Call.findOneAndUpdate(
            {
                _id: req.params.id,
                caller: req.user.id,
                status: { $in: ["calling", "ringing"] }
            },
            { status: "missed", endedAt: new Date() },
            { new: true }
        );
        const io = req.app.get("io");
        if (io && call) {
            io.to(`user:${call.receiver}`).emit("call:ended", call.toObject());
            io.to(`user:${call.caller}`).emit("call:ended", call.toObject());
        }
        return res.json({ success: true, data: call });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
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


exports.getCall = async (req, res) => {
    try {
        const call = await Call.findOne({
            _id: req.params.id,
            $or: [{ caller: req.user.id }, { receiver: req.user.id }]
        });
        if (!call) {
            return res.status(404).json({ success: false, message: "Call not found" });
        }
        return res.json({ success: true, data: call });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ======================================
// CALL HISTORY
// ======================================

exports.getCallHistory = async (req, res) => {
    try {
        const missedBefore = new Date(Date.now() - 60 * 1000);
        await Call.updateMany(
            { receiver: req.user.id, status: { $in: ["calling", "ringing"] }, createdAt: { $lt: missedBefore } },
            { $set: { status: "missed", endedAt: new Date() } }
        );
        const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
        const peer = String(req.query.peer || "").trim();
        const membership = peer
            ? {
                $or: [
                    { caller: req.user.id, receiver: peer },
                    { caller: peer, receiver: req.user.id }
                ]
            }
            : {
                $or: [
                    { caller: req.user.id },
                    { receiver: req.user.id }
                ]
            };

        const calls = await Call.find(membership)
            .populate("caller", "username name profilePic profileImage")
            .populate("receiver", "username name profilePic profileImage")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json({
            success: true,
            data: calls.map((call) => ({
                ...call,
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
