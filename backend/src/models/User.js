import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "hr", "manager", "employee"],
      default: "employee"
    },
    status: {
      type: String,
      enum: ["active", "inactive", "exited"],
      default: "active"
    },
    department: {
      type: String,
      default: "People Operations",
      trim: true
    },
    designation: {
      type: String,
      default: "Employee",
      trim: true
    },
    teamName: {
      type: String,
      default: "General",
      trim: true
    },
    managerEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    managerName: {
      type: String,
      default: "",
      trim: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    dateOfBirth: {
      type: Date
    },
    exitedAt: {
      type: Date
    },
    avatarColor: {
      type: String,
      default: "#0f766e"
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
