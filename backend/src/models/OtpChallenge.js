import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    otpHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    usedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);
