import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Location", locationSchema);
