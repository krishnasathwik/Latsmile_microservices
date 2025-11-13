// src/models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["driver", "rider"], required: true },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  isVerified: { type: Boolean, default: false },
});

export default mongoose.model("User", userSchema);
