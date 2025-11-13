import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "lastmile_db" });
    console.log("MongoDB connected (Location Service)");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};
