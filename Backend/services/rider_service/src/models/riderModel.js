import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  boardingStation: {
    name: String,
    latitude: Number,
    longitude: Number,
  },

  destinationStation: {
    name: String,
    latitude: Number,
    longitude: Number,
  },

  arrivalTime: { type: String, required: true }, // "HH:MM"

  rideStatus: {
    type: String,
    enum: ["waiting", "matched", "on_trip", "completed"],
    default: "waiting",
  },
});

export default mongoose.model("Rider", riderSchema);
