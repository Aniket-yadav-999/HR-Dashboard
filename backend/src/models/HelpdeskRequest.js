import mongoose from "mongoose";

const helpdeskRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      enum: ["hr", "admin", "it", "other"],
      default: "hr"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open"
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    resolutionNote: {
      type: String,
      default: "",
      trim: true
    },
    assignedTo: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

export const HelpdeskRequest = mongoose.model("HelpdeskRequest", helpdeskRequestSchema);
