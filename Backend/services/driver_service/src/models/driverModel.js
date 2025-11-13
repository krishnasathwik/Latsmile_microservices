import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  place: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

const locationSchema = new mongoose.Schema({
  latitude: { type: Number },
  longitude: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  carNumber: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  route: [routeSchema],
  currentLocation: locationSchema,
  status: {
    type: String,
    enum: ["available", "on_trip", "inactive"],
    default: "available",
  },
});

export default mongoose.model("Driver", driverSchema);
