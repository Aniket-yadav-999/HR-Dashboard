import mongoose from "mongoose";

const appraisalSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewCycle: { type: String, required: true, trim: true },
    reviewer: { type: String, default: "", trim: true },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    status: { type: String, enum: ["draft", "scheduled", "in_review", "completed"], default: "draft" },
    dueDate: Date,
    goals: { type: String, default: "", trim: true },
    feedback: { type: String, default: "", trim: true },
    answers: [{
      question: { type: String, required: true, trim: true },
      answer: { type: String, required: true, trim: true }
    }],
    hrNotes: { type: String, default: "", trim: true },
    submittedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Appraisal = mongoose.model("Appraisal", appraisalSchema);
