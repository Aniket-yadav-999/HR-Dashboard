import { Router } from "express";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { scheduleOtpCleanup } from "../services/otpCleanup.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../services/mailService.js";
import { generateOtp, generateToken, hashOtp, hashPassword, verifyPassword } from "../utils/password.js";

const router = Router();

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department,
    designation: user.designation,
    teamName: user.teamName,
    managerEmail: user.managerEmail,
    managerName: user.managerName,
    joinedAt: user.joinedAt,
    dateOfBirth: user.dateOfBirth,
    avatarColor: user.avatarColor
  };
}

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase(), status: { $ne: "exited" } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const otp = generateOtp();
    let emailQueued = true;
    try {
      await sendOtpEmail({ to: user.email, otp, name: user.name });
    } catch {
      emailQueued = false;
    }

    user.loginOtpHash = hashOtp(otp);
    user.loginOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    scheduleOtpCleanup(user._id, user.loginOtpExpiresAt);

    res.json({
      challengeId: user._id,
      message: emailQueued ? "OTP sent to registered email" : "OTP generated; email delivery is temporarily unavailable",
      displayOtp: otp,
      otpExpiresAt: user.loginOtpExpiresAt,
      emailQueued
    });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const { challengeId, otp } = req.body;

    if (!challengeId || !otp) {
      return res.status(400).json({ message: "Challenge and OTP are required" });
    }

    const user = await User.findOne({
      _id: challengeId,
      status: { $ne: "exited" },
      loginOtpExpiresAt: { $gt: new Date() }
    }).select("+loginOtpHash +loginOtpExpiresAt");

    if (!user || user.loginOtpHash !== hashOtp(otp)) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    await user.save();

    const token = generateToken();
    await Session.create({
      user: user._id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/resend-otp", async (req, res, next) => {
  try {
    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({ message: "Challenge is required" });
    }

    const user = await User.findOne({
      _id: challengeId,
      status: { $ne: "exited" }
    });

    if (!user) {
      return res.status(404).json({ message: "OTP challenge not found" });
    }

    const otp = generateOtp();
    let emailQueued = true;
    try {
      await sendOtpEmail({ to: user.email, otp, name: user.name });
    } catch {
      emailQueued = false;
    }

    user.loginOtpHash = hashOtp(otp);
    user.loginOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    scheduleOtpCleanup(user._id, user.loginOtpExpiresAt);

    res.json({
      challengeId: user._id,
      message: emailQueued ? "A new OTP has been sent" : "A new OTP was generated; email delivery is temporarily unavailable",
      displayOtp: otp,
      otpExpiresAt: user.loginOtpExpiresAt,
      emailQueued
    });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const genericMessage = "If an active account exists, a reset code has been sent.";
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email, status: { $ne: "exited" } });
    if (!user) return res.json({ message: genericMessage });

    const otp = generateOtp();
    user.passwordResetOtpHash = hashOtp(otp);
    user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    let emailQueued = true;
    try { await sendPasswordResetEmail({ to: user.email, otp, name: user.name }); } catch { emailQueued = false; }
    res.json({ message: genericMessage, displayOtp: emailQueued ? undefined : otp, emailQueued });
  } catch (error) { next(error); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ message: "Email, reset code and new password are required" });
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ message: "Password must be 8+ characters with uppercase, lowercase and a number" });
    }
    const user = await User.findOne({ email, status: { $ne: "exited" }, passwordResetOtpExpiresAt: { $gt: new Date() } })
      .select("+passwordResetOtpHash +passwordResetOtpExpiresAt");
    if (!user || user.passwordResetOtpHash !== hashOtp(String(otp))) return res.status(400).json({ message: "Invalid or expired reset code" });
    user.passwordHash = hashPassword(password);
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save();
    await Session.deleteMany({ user: user._id });
    res.json({ message: "Password reset successfully. Please sign in." });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await Session.deleteOne({ _id: req.session._id });
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
});

export default router;
