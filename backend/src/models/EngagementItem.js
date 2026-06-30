import mongoose from "mongoose";

const engagementItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["birthday", "work_anniversary", "office_anniversary", "promotion", "recognition", "event", "feedback"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    eventDate: {
      type: Date
    },
    employeeName: {
      type: String,
      default: "",
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export const EngagementItem = mongoose.model("EngagementItem", engagementItemSchema);
