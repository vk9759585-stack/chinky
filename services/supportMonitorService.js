const SupportTicket = require("../models/SupportTicket");
const { notifyAdmins } = require("./supportNotificationService");

async function checkSupportSla(app) {
  const now = new Date();
  const overdue = await SupportTicket.find({
    status: { $in: ["open", "in_progress"] },
    slaDueAt: { $lt: now },
    overdueAlerted: { $ne: true }
  }).sort({ slaDueAt: 1 }).limit(50);

  for (const ticket of overdue) {
    ticket.slaBreachedAt = ticket.slaBreachedAt || now;
    ticket.overdueAlerted = true;
    ticket.escalated = true;
    if (["low", "normal"].includes(ticket.priority)) ticket.priority = "high";
    ticket.auditTrail.push({ action: "sla_breached", actor: "system", detail: "Human support response SLA expired" });
    await ticket.save();
    await notifyAdmins(app, {
      title: "Overdue support ticket",
      body: `${ticket.ticketNumber}: ${ticket.subject}`,
      ticket
    });
  }
  return overdue.length;
}

function startSupportMonitor(app) {
  const run = () => checkSupportSla(app).catch((error) => {
    console.error("Support SLA monitor error:", error.message);
  });
  const initial = setTimeout(run, 20 * 1000);
  const interval = setInterval(run, 5 * 60 * 1000);
  initial.unref?.();
  interval.unref?.();
  return interval;
}

module.exports = { checkSupportSla, startSupportMonitor };
