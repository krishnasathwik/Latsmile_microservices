import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  riderEmail: { type: String, required: true, unique: true }, 
  driverEmail: { type: String, required: true },

  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
  },

  matchedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Match", matchSchema);
