import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    assetTag: {
      type: String,
      required: true,
      unique: true,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export const Asset = mongoose.model("Asset", assetSchema);
