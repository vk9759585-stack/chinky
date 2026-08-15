const Chat = require("../models/Chat");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { getSockets } = require("../socket/users");

// ====================================
// UPLOAD CHAT ATTACHMENT
// ====================================

exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Attachment is required"
            });
        }

        let url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        try {
            const uploaded = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto",
                folder: "chinky/chat"
            });
            url = uploaded.secure_url;
            await fs.promises.unlink(req.file.path).catch(() => {});
        } catch (_) {
            // Keep the local upload URL when Cloudinary is not configured.
        }

        return res.status(201).json({
            success: true,
            data: {
                url,
                name: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ====================================
// SEND MESSAGE
// ====================================

exports.sendMessage = async (req, res) => {

    try {

        const {

            receiverId,

            message,

            type,

            replyTo

        } = req.body;

        const receiverOnline = getSockets(receiverId).size > 0;

        const chat = await Chat.create({

            sender: req.user.id,

            receiver: receiverId,

            message: message || "",

            type: type || "text",

            delivered: receiverOnline,

            replyTo: replyTo || null,

            image: req.body.image || "",

            voice: req.body.voice || "",

            video: req.body.video || "",

            file: req.body.file || ""

        });

        const result = await Chat.findById(chat._id)

            .populate("sender", "name username profileImage")

            .populate("receiver", "name username profileImage")

            .populate("replyTo");

        const io = req.app.get("io");
        if (io) {
            io.to(`user:${receiverId}`).emit("message:new", result.toObject());
        }

        res.status(201).json({

            success: true,

            message: "Message sent",

            data: result

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// GET CHAT
// ====================================

exports.getMessages = async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 30;

        const skip = (page - 1) * limit;

        await Chat.updateMany(
            { sender: req.params.userId, receiver: req.user.id, seen: false },
            { $set: { delivered: true, seen: true, seenAt: new Date() } }
        );
        const io = req.app.get("io");
        if (io) io.to(`user:${req.params.userId}`).emit("chat:seen", { by: req.user.id });

        const chats = await Chat.find({

            $or: [

                {

                    sender: req.user.id,

                    receiver: req.params.userId

                },

                {

                    sender: req.params.userId,

                    receiver: req.user.id

                }

            ],

            deletedForEveryone: false,

            deletedFor: {

                $ne: req.user.id

            }

        })

        .populate("replyTo")

        .sort({

            createdAt: -1

        })

        .skip(skip)

        .limit(limit);

        res.json({

            success: true,

            page,

            count: chats.length,

            data: chats.reverse().map((chat) => ({
                ...chat.toObject(),
                isMine: chat.sender?.toString() === req.user.id.toString()
            }))

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// PRESENCE
// ====================================
exports.getPresence = async (req, res) => {
    const sockets = getSockets(req.params.userId);
    return res.json({ success: true, online: sockets.size > 0 });
};

// ====================================
// MARK MESSAGE AS SEEN
// ====================================

exports.markSeen = async (req, res) => {

    try {

        const chat = await Chat.findOneAndUpdate(
            { _id: req.params.id, receiver: req.user.id },
            { seen: true, delivered: true, seenAt: new Date() },
            { new: true }
        );

        const io = req.app.get("io");
        if (io && chat) io.to(`user:${chat.sender}`).emit("chat:seen", { messageId: chat._id, by: req.user.id });

        res.json({

            success: true,

            data: chat

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// EDIT MESSAGE
// ====================================

exports.editMessage = async (req, res) => {

    try {

        const chat = await Chat.findById(req.params.id);

        if (!chat) {

            return res.status(404).json({

                success: false,

                message: "Message not found"

            });

        }

        if (

            chat.sender.toString() !==

            req.user.id

        ) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized"

            });

        }

        chat.message = req.body.message;

        chat.edited = true;

        await chat.save();

        res.json({

            success: true,

            data: chat

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// DELETE FOR ME
// ====================================

exports.deleteForMe = async (req, res) => {

    try {

        const chat = await Chat.findById(req.params.id);

        if (!chat) {

            return res.status(404).json({
                success: false,
                message: "Message not found"
            });

        }

        if (!chat.deletedFor.includes(req.user.id)) {

            chat.deletedFor.push(req.user.id);

            await chat.save();

        }

        res.json({
            success: true,
            message: "Deleted for me"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ====================================
// DELETE FOR EVERYONE
// ====================================

exports.deleteForEveryone = async (req, res) => {

    try {

        const chat = await Chat.findById(req.params.id);

        if (!chat) {

            return res.status(404).json({
                success: false,
                message: "Message not found"
            });

        }

        if (chat.sender.toString() !== req.user.id) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }

        chat.deletedForEveryone = true;

        chat.message = "";

        chat.image = "";

        chat.voice = "";

        chat.video = "";

        chat.file = "";

        await chat.save();

        res.json({
            success: true,
            message: "Deleted for everyone"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ====================================
// FORWARD MESSAGE
// ====================================

exports.forwardMessage = async (req, res) => {

    try {

        const oldMessage = await Chat.findById(req.params.id);

        if (!oldMessage) {

            return res.status(404).json({
                success: false,
                message: "Message not found"
            });

        }

        const chat = await Chat.create({

            sender: req.user.id,

            receiver: req.body.receiverId,

            message: oldMessage.message,

            image: oldMessage.image,

            voice: oldMessage.voice,

            video: oldMessage.video,

            file: oldMessage.file,

            type: oldMessage.type,

            forwarded: true

        });

        res.status(201).json({

            success: true,

            data: chat

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// PIN MESSAGE
// ====================================

exports.pinMessage = async (req, res) => {

    try {

        const chat = await Chat.findOne({
            _id: req.params.id,
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        chat.pinned = !chat.pinned;

        await chat.save();

        res.json({

            success: true,

            pinned: chat.pinned

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// REPLY MESSAGE
// ====================================

exports.replyMessage = async (req, res) => {

    try {

        const chat = await Chat.create({

            sender: req.user.id,

            receiver: req.body.receiverId,

            message: req.body.message,

            replyTo: req.body.replyTo,

            type: "text"

        });

        res.status(201).json({

            success: true,

            data: chat

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// ADD REACTION
// ====================================

exports.addReaction = async (req, res) => {

    try {

        const { emoji } = req.body;

        const chat = await Chat.findOne({
            _id: req.params.id,
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        });

        if (!chat) {

            return res.status(404).json({
                success: false,
                message: "Message not found"
            });

        }

        chat.reactions = chat.reactions.filter(
            r => r.user.toString() !== req.user.id
        );

        chat.reactions.push({
            user: req.user.id,
            emoji: emoji || "❤️"
        });

        await chat.save();

        res.json({
            success: true,
            data: chat
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ====================================
// REMOVE REACTION
// ====================================

exports.removeReaction = async (req, res) => {

    try {

        const chat = await Chat.findById(req.params.id);

        if (!chat) {

            return res.status(404).json({
                success: false,
                message: "Message not found"
            });

        }

        chat.reactions = chat.reactions.filter(
            r => r.user.toString() !== req.user.id
        );

        await chat.save();

        res.json({
            success: true,
            data: chat
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ====================================
// SEARCH MESSAGES
// ====================================

exports.searchMessages = async (req, res) => {

    try {

        const keyword = req.query.q || "";

        const chats = await Chat.find({

            message: {
                $regex: keyword,
                $options: "i"
            },

            $or: [

                {
                    sender: req.user.id
                },

                {
                    receiver: req.user.id
                }

            ]

        }).sort({
            createdAt: -1
        });

        res.json({
            success: true,
            count: chats.length,
            data: chats
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ====================================
// CHAT STATISTICS
// ====================================

exports.chatStats = async (req, res) => {

    try {

        const total = await Chat.countDocuments({

            $or: [

                { sender: req.user.id },

                { receiver: req.user.id }

            ]

        });

        const unseen = await Chat.countDocuments({

            receiver: req.user.id,

            seen: false

        });

        res.json({

            success: true,

            data: {

                totalMessages: total,

                unseenMessages: unseen

            }

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ====================================
// RECENT CONVERSATIONS
// ====================================
exports.getConversations = async (req, res) => {
    try {
        const chats = await Chat.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }],
            deletedForEveryone: false,
            deletedFor: { $ne: req.user.id }
        })
            .populate("sender", "name username profileImage")
            .populate("receiver", "name username profileImage")
            .sort({ createdAt: -1 });

        const conversations = [];
        const seen = new Set();
        for (const chat of chats) {
            const senderId = chat.sender?._id?.toString() ?? chat.sender?.toString();
            const otherUser = senderId === req.user.id.toString() ? chat.receiver : chat.sender;
            const otherUserId = otherUser?._id?.toString() ?? otherUser?.toString();
            if (!otherUserId || seen.has(otherUserId)) continue;
            seen.add(otherUserId);
            conversations.push({
                userId: otherUserId,
                username: otherUser?.username || otherUser?.name || "Chat",
                profileImage: otherUser?.profileImage || "",
                lastMessage: chat.message || "Media message",
                createdAt: chat.createdAt
            });
        }
        res.json({ success: true, data: conversations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
