import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true,
      trim: true
    },
    day: {
      type: String,
      required: true,
      trim: true
    },
    imageKey: {
      type: String,
      default: "festival",
      trim: true
    }
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

export const Holiday = mongoose.model("Holiday", holidaySchema);
