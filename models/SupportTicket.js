const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "ai", "staff", "system"], required: true },
  text: { type: String, trim: true, maxlength: 5000, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true, maxlength: 80 },
  actor: { type: String, enum: ["user", "ai", "staff", "system"], default: "system" },
  detail: { type: String, maxlength: 500, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const schema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  category: {
    type: String,
    enum: ["account", "payments", "audio", "copyright", "safety", "technical", "other"],
    default: "technical",
    index: true
  },
  priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal", index: true },
  subject: { type: String, trim: true, maxlength: 160, required: true },
  message: { type: String, trim: true, maxlength: 5000, required: true },
  messages: { type: [messageSchema], default: [] },
  status: {
    type: String,
    enum: ["open", "in_progress", "waiting_for_user", "resolved", "closed"],
    default: "open",
    index: true
  },
  source: { type: String, enum: ["ai_chat", "manual", "feedback"], default: "ai_chat" },
  tags: { type: [String], default: [] },
  ai: {
    engine: { type: String, enum: ["chinky-ai", "openai", "fallback"], default: "chinky-ai" },
    provider: { type: String, enum: ["openai", "local_rules"], default: "local_rules" },
    model: { type: String, default: "" },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    summary: { type: String, maxlength: 1000, default: "" },
    lastReply: { type: String, maxlength: 5000, default: "" },
    suggestedActions: { type: [String], default: [] },
    canAutoResolve: { type: Boolean, default: false },
    moderationFlagged: { type: Boolean, default: false }
  },
  escalated: { type: Boolean, default: false, index: true },
  escalationReason: { type: String, maxlength: 500, default: "" },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "SupportTicket", default: null },
  slaDueAt: { type: Date, default: null, index: true },
  slaBreachedAt: { type: Date, default: null },
  overdueAlerted: { type: Boolean, default: false },
  lastActivityAt: { type: Date, default: Date.now, index: true },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  auditTrail: { type: [auditSchema], default: [] }
}, { timestamps: true });

schema.pre("validate", function assignTicketNumber(next) {
  if (!this.ticketNumber) {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.ticketNumber = `CHK-${time}-${random}`;
  }
  next();
});

schema.index({ user: 1, createdAt: -1 });
schema.index({ status: 1, priority: 1, slaDueAt: 1 });
schema.index({ escalated: 1, status: 1, lastActivityAt: -1 });

module.exports = mongoose.model("SupportTicket", schema);
