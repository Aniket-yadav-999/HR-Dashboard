import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    assetId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true
    },
    // Kept for records created before assetId was introduced.
    assetTag: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ["laptop", "desktop", "accessory", "mouse", "other"],
      default: "laptop"
    },
    status: {
      type: String,
      enum: ["available", "issued", "maintenance", "returned", "retired"],
      default: "available"
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    brandModel: {
      type: String,
      default: "",
      trim: true
    },
    serialNumber: {
      type: String,
      default: "",
      trim: true
    },
    department: {
      type: String,
      default: "",
      trim: true
    },
    location: {
      type: String,
      default: "",
      trim: true
    },
    issuedAt: {
      type: Date
    },
    returnedAt: {
      type: Date
    },
    condition: {
      type: String,
      enum: ["new", "good", "needs_repair", "damaged"],
      default: "good"
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    ipAddress: {
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

export const Asset = mongoose.model("Asset", assetSchema);
