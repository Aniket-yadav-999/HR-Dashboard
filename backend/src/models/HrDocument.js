import mongoose from "mongoose";

const hrDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const HrDocument = mongoose.model("HrDocument", hrDocumentSchema);
