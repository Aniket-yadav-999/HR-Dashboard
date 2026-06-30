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
    }
  },
  { timestamps: true }
);

export const AttendanceRequest = mongoose.model("AttendanceRequest", attendanceRequestSchema);
