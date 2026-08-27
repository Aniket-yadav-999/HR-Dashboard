import mongoose from "mongoose";

const reimbursementSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: ["travel", "food", "office", "other"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    expenseDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "reviewed", "paid"], default: "pending" },
    proofFileName: { type: String, required: true, trim: true },
    proofMimeType: { type: String, required: true },
    proofSize: { type: Number, required: true },
    proofData: { type: Buffer, required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Reimbursement = mongoose.model("Reimbursement", reimbursementSchema);
