import mongoose from "mongoose";

const attendanceRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    fromDate: { type: Date },
    toDate: { type: Date },
    dayPortion: {
      type: String,
      enum: ["full_day", "first_half", "second_half"],
      default: "full_day"
    },
    type: {
      type: String,
      enum: ["present", "work_from_home", "paid_leave", "sick_leave", "client_visit", "half_day", "spot_visit"],
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    clientName: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    mailSubject: {
      type: String,
      trim: true
    },
    mailBody: {
      type: String,
      trim: true
    },
    mailTo: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ],
    mailCc: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ],
    mailStatus: {
      type: String,
      enum: ["not_sent", "sent", "failed"],
      default: "not_sent"
    },
    approvalStatus: {
      type: String,
      enum: ["not_required", "pending_manager", "pending_hr", "approved", "rejected", "cancelled", "withdrawn"],
      default: "not_required"
    },
    managerActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    managerActionAt: { type: Date },
    managerComment: { type: String, trim: true, default: "" },
    hrActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hrActionAt: { type: Date },
    hrComment: { type: String, trim: true, default: "" },
    cancelledAt: { type: Date },
    withdrawnAt: { type: Date }
  },
  { timestamps: true }
);

export const AttendanceRequest = mongoose.model("AttendanceRequest", attendanceRequestSchema);
