const assert = require("assert");
const mongoose = require("mongoose");
const { analyzeSupportMessage, redactSensitive } = require("../services/supportAiService");
const SupportTicket = require("../models/SupportTicket");

async function main() {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const technical = await analyzeSupportMessage({
      message: "camera aur gallery me photo video nahi dikh raha hai",
      userId: "smoke-user"
    });
    assert.equal(technical.category, "technical");
    assert.equal(technical.engine, "chinky-ai");
    assert.equal(technical.provider, "local_rules");
    assert.ok(technical.reply.length > 20);

    const payment = await analyzeSupportMessage({
      message: "payment cut gaya coins nahi mile, refund chahiye",
      userId: "smoke-user"
    });
    assert.equal(payment.category, "payments");
    assert.equal(payment.needsHuman, true);
    assert.ok(["high", "urgent"].includes(payment.priority));

    const safety = await analyzeSupportMessage({
      message: "someone is blackmailing and threatening me",
      userId: "smoke-user"
    });
    assert.equal(safety.category, "safety");
    assert.equal(safety.needsHuman, true);
    assert.equal(safety.priority, "urgent");

    const redacted = redactSensitive("OTP: 123456 card 4111 1111 1111 1111");
    assert.ok(!redacted.includes("123456"));
    assert.ok(!redacted.includes("4111"));

    const ticket = new SupportTicket({
      user: new mongoose.Types.ObjectId(),
      subject: "Smoke support ticket",
      message: "Camera is not working",
      messages: [{ sender: "user", text: "Camera is not working" }]
    });
    await ticket.validate();
    assert.match(ticket.ticketNumber, /^CHK-[A-Z0-9]+-[A-Z0-9]{4}$/);
    assert.equal(ticket.messages.length, 1);
    console.log("Support AI fallback smoke test passed");
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
