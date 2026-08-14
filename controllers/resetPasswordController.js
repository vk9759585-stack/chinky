const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendOtp, normalizedPhone } = require("../services/msg91Service");

const normalizeIdentifier = (value) => String(value || "").trim().replace(/^@/, "");

async function findUser(identifier) {
  const value = normalizeIdentifier(identifier);
  if (!value) return null;

  const lower = value.toLowerCase();
  const digits = value.replace(/\D/g, "");
  const phoneCandidates = new Set([value]);
  if (digits.length === 10) {
    phoneCandidates.add(digits);
    phoneCandidates.add(`91${digits}`);
    phoneCandidates.add(`+91${digits}`);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    phoneCandidates.add(digits);
    phoneCandidates.add(digits.slice(2));
    phoneCandidates.add(`+${digits}`);
  }

  return User.findOne({
    $or: [
      { username: lower },
      { email: lower },
      { phone: { $in: [...phoneCandidates] } },
    ],
  });
}

function maskedPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 4) return "your registered mobile";
  return `******${digits.slice(-4)}`;
}

exports.requestReset = async (req, res) => {
  try {
    const identifier = normalizeIdentifier(req.body.identifier);
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Enter username, email or phone number" });
    }

    const user = await findUser(identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: "No Chinky account found with these details" });
    }

    const phone = normalizedPhone(user.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: "This account does not have a valid recovery mobile number" });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ user: user._id, purpose: "forgot_password" });
    await sendOtp(phone, otp);
    await Otp.create({ user: user._id, email: user.email, phone, otp, purpose: "forgot_password", expiresAt });

    return res.json({
      success: true,
      message: `OTP sent to ${maskedPhone(phone)}`,
      recoveryId: user._id.toString(),
      destination: maskedPhone(phone),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Could not send reset OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const recoveryId = String(req.body.recoveryId || "").trim();
    const otp = String(req.body.otp || "").trim();
    if (!recoveryId || !otp) {
      return res.status(400).json({ success: false, message: "Recovery ID and OTP are required" });
    }

    const record = await Otp.findOne({ user: recoveryId, otp, purpose: "forgot_password" });
    if (!record) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    await User.updateOne(
      { _id: recoveryId },
      { $set: { resetPasswordToken: resetTokenHash, resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000) } }
    );
    await Otp.deleteMany({ user: recoveryId, purpose: "forgot_password" });

    return res.json({ success: true, message: "OTP verified", resetToken });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Could not verify OTP" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const recoveryId = String(req.body.recoveryId || "").trim();
    const resetToken = String(req.body.resetToken || "").trim();
    const password = String(req.body.password || "");
    if (!recoveryId || !resetToken || !password) {
      return res.status(400).json({ success: false, message: "Reset verification and new password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
      _id: recoveryId,
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ success: false, message: "Reset session expired. Start again" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpire = null;
    await user.save();

    return res.json({ success: true, message: "Password reset successfully. You can now sign in" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Could not reset password" });
  }
};
