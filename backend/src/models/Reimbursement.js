import mongoose from "mongoose";

const reimbursementSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: ["travel", "food", "medical", "internet", "office", "other"], default: "other" },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ["submitted", "under_review", "approved", "rejected", "paid"], default: "submitted" },
    reference: { type: String, default: "", trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Reimbursement = mongoose.model("Reimbursement", reimbursementSchema);
