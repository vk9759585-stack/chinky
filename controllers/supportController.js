const SupportTicket = require("../models/SupportTicket");
const Feedback = require("../models/Feedback");
const knowledgeBase = require("../data/supportKnowledgeBase");
const {
  analyzeSupportMessage,
  cleanText,
  redactSensitive,
  slaDueAt,
  higherPriority,
  categories,
  assistantIdentity
} = require("../services/supportAiService");
const { notifyUser, notifyAdmins } = require("../services/supportNotificationService");

const messageWindows = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 12;
const OPEN_STATUSES = ["open", "in_progress", "waiting_for_user"];

function userIdFrom(req) {
  return req.user?.id || req.user?._id || req.user?.userId;
}

function ticketForClient(ticket) {
  const value = typeof ticket?.toObject === "function" ? ticket.toObject() : { ...ticket };
  if (value.ai) {
    value.ai = { ...value.ai, engine: assistantIdentity.id };
    delete value.ai.provider;
    delete value.ai.model;
  }
  return value;
}

function rateAllowed(userId) {
  const now = Date.now();
  const active = (messageWindows.get(userId) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (active.length >= RATE_LIMIT) {
    messageWindows.set(userId, active);
    return false;
  }
  active.push(now);
  messageWindows.set(userId, active);
  if (messageWindows.size > 10000) {
    for (const [key, times] of messageWindows) {
      if (!times.some((time) => now - time < RATE_WINDOW_MS)) messageWindows.delete(key);
    }
  }
  return true;
}

function tokenSet(value) {
  const ignored = new Set(["the", "and", "for", "this", "that", "with", "hai", "mera", "meri", "karo", "nahi", "please", "help"]);
  return new Set(cleanText(value).toLowerCase()
    .split(/[^a-z0-9\u0900-\u097f]+/)
    .filter((word) => word.length > 2 && !ignored.has(word)));
}

function similarity(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (a.size < 2 || b.size < 2) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared);
}

async function findDuplicate(userId, analysis, message) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const candidates = await SupportTicket.find({
    user: userId,
    status: { $in: OPEN_STATUSES },
    category: analysis.category,
    lastActivityAt: { $gte: since }
  }).sort({ lastActivityAt: -1 }).limit(12);
  return candidates.find((ticket) => similarity(
    `${message} ${analysis.subject}`,
    `${ticket.message} ${ticket.subject} ${ticket.ai?.summary || ""}`
  ) >= 0.58) || null;
}

async function processSupportMessage(req, res, source = "ai_chat") {
  try {
    const userId = userIdFrom(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!rateAllowed(String(userId))) {
      return res.status(429).json({
        success: false,
        message: "Please wait a moment before sending another support message. Your existing ticket is safe."
      });
    }

    const rawMessage = cleanText(req.body.message);
    if (rawMessage.length < 3) {
      return res.status(400).json({ success: false, message: "Please describe the issue in at least 3 characters." });
    }
    const storedMessage = redactSensitive(rawMessage);
    const requestedTicketId = req.params.id || req.body.ticketId;
    let ticket = null;
    let duplicate = false;
    if (requestedTicketId) {
      ticket = await SupportTicket.findOne({ _id: requestedTicketId, user: userId });
      if (!ticket) return res.status(404).json({ success: false, message: "Support ticket not found" });
    }

    const categoryHint = categories.includes(req.body.categoryHint)
      ? req.body.categoryHint
      : (categories.includes(req.body.category) ? req.body.category : (ticket?.category || ""));
    const analysis = await analyzeSupportMessage({
      message: rawMessage,
      userId: String(userId),
      history: ticket?.messages || [],
      categoryHint
    });

    if (!ticket) {
      ticket = await findDuplicate(userId, analysis, storedMessage);
      duplicate = Boolean(ticket);
    }

    const now = new Date();
    const wasEscalated = ticket?.escalated === true;
    if (!ticket) {
      const requestedSubject = cleanText(req.body.subject, 160);
      ticket = new SupportTicket({
        user: userId,
        category: analysis.category,
        priority: analysis.priority,
        subject: requestedSubject || analysis.subject,
        message: storedMessage,
        source,
        messages: [],
        status: analysis.needsHuman ? "open" : "waiting_for_user",
        tags: analysis.tags,
        ai: {},
        escalated: analysis.needsHuman,
        escalationReason: analysis.escalationReason,
        slaDueAt: slaDueAt(analysis.priority, now),
        lastActivityAt: now,
        auditTrail: [{ action: "ticket_created", actor: "user", detail: `Created from ${source}` }]
      });
    } else {
      ticket.priority = higherPriority(ticket.priority, analysis.priority);
      if (ticket.category === "other" || analysis.confidence >= (ticket.ai?.confidence || 0)) {
        ticket.category = analysis.category;
      }
      if (["resolved", "closed"].includes(ticket.status)) {
        ticket.status = analysis.needsHuman ? "open" : "waiting_for_user";
        ticket.resolvedAt = null;
        ticket.closedAt = null;
        ticket.auditTrail.push({ action: "ticket_reopened", actor: "user", detail: "User sent a new message" });
      } else if (analysis.needsHuman && ticket.status === "waiting_for_user") {
        ticket.status = "open";
      }
      ticket.escalated = ticket.escalated || analysis.needsHuman;
      if (analysis.escalationReason) ticket.escalationReason = analysis.escalationReason;
      ticket.slaDueAt = slaDueAt(ticket.priority, now);
      ticket.overdueAlerted = false;
      ticket.auditTrail.push({
        action: duplicate ? "duplicate_merged" : "message_received",
        actor: "user",
        detail: duplicate ? "Matched a recent open ticket" : "Conversation continued"
      });
    }

    ticket.messages.push({ sender: "user", text: storedMessage, createdAt: now });
    ticket.messages.push({ sender: "ai", text: analysis.reply, createdAt: now });
    ticket.lastActivityAt = now;
    ticket.tags = [...new Set([...(ticket.tags || []), ...analysis.tags])].slice(0, 12);
    ticket.ai = {
      engine: analysis.engine,
      provider: analysis.provider,
      model: analysis.model,
      confidence: analysis.confidence,
      summary: analysis.summary,
      lastReply: analysis.reply,
      suggestedActions: analysis.suggestedActions,
      canAutoResolve: analysis.canAutoResolve,
      moderationFlagged: analysis.moderationFlagged
    };
    await ticket.save();

    if (ticket.escalated && !wasEscalated) {
      await notifyAdmins(req.app, {
        title: `${ticket.priority.toUpperCase()} support ticket`,
        body: `${ticket.ticketNumber}: ${ticket.subject}`,
        ticket,
        excludeUser: userId
      });
    }

    return res.status(source === "manual" && !duplicate ? 201 : 200).json({
      success: true,
      data: ticketForClient(ticket),
      reply: analysis.reply,
      escalated: ticket.escalated,
      duplicate,
      assistant: assistantIdentity,
      engine: assistantIdentity.id,
      confidence: analysis.confidence,
      safetyNotice: "Never share your password, OTP, PIN, recovery code, full card number or CVV."
    });
  } catch (err) {
    const status = err?.name === "CastError" ? 400 : 500;
    return res.status(status).json({ success: false, message: status === 400 ? "Invalid support ticket" : err.message });
  }
}

exports.assistant = (req, res) => processSupportMessage(req, res, "ai_chat");
exports.continueTicket = (req, res) => processSupportMessage(req, res, "ai_chat");
exports.createTicket = (req, res) => processSupportMessage(req, res, "manual");

exports.submitFeedback = async (req, res) => {
  try {
    const message = cleanText(req.body.message);
    if (!message) return res.status(400).json({ success: false, message: "Feedback is required" });
    const userId = userIdFrom(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const feedback = await Feedback.create({ user: userId, message: redactSensitive(message) });
    return res.status(201).json({ success: true, data: { id: feedback._id, status: feedback.status } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.myTickets = async (req, res) => {
  try {
    const data = await SupportTicket.find({ user: userIdFrom(req) })
      .sort({ lastActivityAt: -1 }).limit(50).lean();
    return res.json({ success: true, data: data.map(ticketForClient) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: userIdFrom(req) }).lean();
    if (!ticket) return res.status(404).json({ success: false, message: "Support ticket not found" });
    return res.json({ success: true, data: ticketForClient(ticket) });
  } catch (err) {
    return res.status(err?.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to load ticket" });
  }
};

exports.updateMyTicketStatus = async (req, res) => {
  try {
    const status = String(req.body.status || "");
    if (!["open", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: userIdFrom(req) });
    if (!ticket) return res.status(404).json({ success: false, message: "Support ticket not found" });
    ticket.status = status;
    ticket.lastActivityAt = new Date();
    ticket.resolvedAt = status === "resolved" ? new Date() : null;
    ticket.closedAt = status === "closed" ? new Date() : null;
    if (status === "open") ticket.slaDueAt = slaDueAt(ticket.priority);
    ticket.auditTrail.push({ action: `status_${status}`, actor: "user", detail: "Status changed by user" });
    await ticket.save();
    return res.json({ success: true, data: ticketForClient(ticket) });
  } catch (err) {
    return res.status(err?.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to update ticket" });
  }
};

exports.help = async (_req, res) => res.json({
  success: true,
  data: knowledgeBase.map(({ id, category, title, answer, actions }) => ({ id, category, title, body: answer, actions }))
});

exports.assistantIdentity = async (_req, res) => res.json({
  success: true,
  data: assistantIdentity
});

exports.adminDashboard = async (_req, res) => {
  try {
    const now = new Date();
    const [open, escalated, overdue, urgent, statusRows] = await Promise.all([
      SupportTicket.countDocuments({ status: { $in: OPEN_STATUSES } }),
      SupportTicket.countDocuments({ escalated: true, status: { $in: OPEN_STATUSES } }),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] }, slaDueAt: { $lt: now } }),
      SupportTicket.countDocuments({ priority: "urgent", status: { $in: OPEN_STATUSES } }),
      SupportTicket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    ]);
    return res.json({
      success: true,
      data: { open, escalated, overdue, urgent, byStatus: Object.fromEntries(statusRows.map((row) => [row._id, row.count])) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminTickets = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && req.query.status !== "all") query.status = req.query.status;
    if (req.query.priority && req.query.priority !== "all") query.priority = req.query.priority;
    if (req.query.category && req.query.category !== "all") query.category = req.query.category;
    if (req.query.escalated === "true") query.escalated = true;
    if (req.query.overdue === "true") {
      query.slaDueAt = { $lt: new Date() };
      query.status = { $in: ["open", "in_progress"] };
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const data = await SupportTicket.find(query)
      .populate("user", "name username email profileImage")
      .populate("assignedTo", "name username")
      .sort({ priority: -1, slaDueAt: 1, lastActivityAt: -1 })
      .limit(limit).lean();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminUpdateStatus = async (req, res) => {
  try {
    const status = String(req.body.status || "");
    if (!["open", "in_progress", "waiting_for_user", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Support ticket not found" });
    ticket.status = status;
    ticket.assignedTo = req.body.assignedTo || (status === "in_progress" ? userIdFrom(req) : ticket.assignedTo);
    ticket.lastActivityAt = new Date();
    ticket.resolvedAt = status === "resolved" ? new Date() : null;
    ticket.closedAt = status === "closed" ? new Date() : null;
    if (["open", "in_progress"].includes(status)) ticket.slaDueAt = slaDueAt(ticket.priority);
    ticket.auditTrail.push({ action: `status_${status}`, actor: "staff", detail: cleanText(req.body.note, 500) });
    await ticket.save();
    await notifyUser(req.app, {
      receiver: ticket.user,
      title: "Support ticket updated",
      body: `${ticket.ticketNumber} is now ${status.replaceAll("_", " ")}.`,
      ticket
    });
    return res.json({ success: true, data: ticket });
  } catch (err) {
    return res.status(err?.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to update ticket" });
  }
};

exports.adminReply = async (req, res) => {
  try {
    const replyText = cleanText(req.body.message);
    if (replyText.length < 2) return res.status(400).json({ success: false, message: "Reply is required" });
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Support ticket not found" });
    const now = new Date();
    ticket.messages.push({ sender: "staff", text: replyText, createdAt: now });
    ticket.status = req.body.status === "resolved" ? "resolved" : "waiting_for_user";
    ticket.assignedTo = userIdFrom(req);
    ticket.lastActivityAt = now;
    ticket.resolvedAt = ticket.status === "resolved" ? now : null;
    ticket.auditTrail.push({ action: "staff_reply", actor: "staff", detail: "Human support replied" });
    await ticket.save();
    await notifyUser(req.app, {
      receiver: ticket.user,
      title: "Human support replied",
      body: `${ticket.ticketNumber}: ${replyText.slice(0, 120)}`,
      ticket
    });
    return res.json({ success: true, data: ticket });
  } catch (err) {
    return res.status(err?.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to send reply" });
  }
};
