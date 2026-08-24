import mongoose from "mongoose";

const appraisalTemplateSchema = new mongoose.Schema(
  {
    reviewCycle: { type: String, required: true, trim: true, unique: true },
    questions: [{ type: String, required: true, trim: true }],
    active: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const AppraisalTemplate = mongoose.model("AppraisalTemplate", appraisalTemplateSchema);
