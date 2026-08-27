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
    employeeCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    loginOtpHash: {
      type: String,
      select: false
    },
    loginOtpExpiresAt: {
      type: Date,
      select: false
    },
    passwordResetOtpHash: { type: String, select: false },
    passwordResetOtpExpiresAt: { type: Date, select: false },
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
    location: {
      type: String,
      default: "",
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
    firstName: { type: String, default: "", trim: true },
    middleName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    displayName: { type: String, default: "", trim: true },
    gender: { type: String, enum: ["", "male", "female", "non_binary", "prefer_not_to_say"], default: "" },
    maritalStatus: { type: String, enum: ["", "single", "married", "divorced", "widowed"], default: "" },
    bloodGroup: { type: String, default: "", trim: true },
    physicallyHandicapped: { type: String, enum: ["", "yes", "no", "prefer_not_to_say"], default: "" },
    nationality: { type: String, default: "", trim: true },
    personalEmail: { type: String, default: "", lowercase: true, trim: true },
    mobileNumber: { type: String, default: "", trim: true },
    workNumber: { type: String, default: "", trim: true },
    residenceNumber: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    emergencyContactName: { type: String, default: "", trim: true },
    emergencyContactNumber: { type: String, default: "", trim: true },
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
    },
    profilePhotoFileName: { type: String, default: "", trim: true },
    profilePhotoMimeType: { type: String, default: "" },
    profilePhotoSize: { type: Number, default: 0 },
    profilePhotoData: { type: Buffer, select: false }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
