import { Router } from "express";
import { OtpChallenge } from "../models/OtpChallenge.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendOtpEmail } from "../services/mailService.js";
import { generateOtp, generateToken, hashOtp, verifyPassword } from "../utils/password.js";

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
    const challenge = await OtpChallenge.create({
      user: user._id,
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOtpEmail({ to: user.email, otp, name: user.name });

    res.json({
      challengeId: challenge._id,
      message: "OTP sent to registered email",
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp
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

    const challenge = await OtpChallenge.findOne({
      _id: challengeId,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    }).populate("user");

    if (!challenge || challenge.otpHash !== hashOtp(otp)) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    challenge.usedAt = new Date();
    await challenge.save();

    const token = generateToken();
    await Session.create({
      user: challenge.user._id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({ token, user: publicUser(challenge.user) });
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

    const existingChallenge = await OtpChallenge.findOne({
      _id: challengeId,
      usedAt: { $exists: false }
    }).populate("user");

    if (!existingChallenge || !existingChallenge.user) {
      return res.status(404).json({ message: "OTP challenge not found" });
    }

    existingChallenge.usedAt = new Date();
    await existingChallenge.save();

    const otp = generateOtp();
    const challenge = await OtpChallenge.create({
      user: existingChallenge.user._id,
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOtpEmail({ to: existingChallenge.user.email, otp, name: existingChallenge.user.name });

    res.json({
      challengeId: challenge._id,
      message: "A new OTP has been sent",
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp
    });
  } catch (error) {
    next(error);
  }
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
