import mongoose from "mongoose";

// Schema for each nearby location
const nearbyLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

// Schema for a metro station
const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  nearbyLocations: [nearbyLocationSchema],
});

export default mongoose.model("Station", stationSchema);
