import mongoose from "mongoose";
import dotenv from "dotenv";
import Station from "../models/stationModel.js";
import stations from "./stations.json" assert { type: "json" };

dotenv.config();

const seedStations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/lastmile_db");
    console.log("✅ MongoDB connected");

    await Station.deleteMany({});
    await Station.insertMany(stations);

    console.log("🌍 Stations inserted successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error seeding stations:", err);
    process.exit(1);
  }
};

seedStations();
