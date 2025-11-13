
import "./config/loadEnv.js"; 
import express from "express";
import mongoose from "mongoose";
import matchingRoutes from "./routes/matchingRoutes.js";
import { startMatchingGrpc } from "./grpc/server.js";
import cors from "cors";


const app = express();
// ✅ Configure CORS properly
app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Enable preflight requests explicitly
app.options(/.*/, cors());




app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { dbName: "lastmile_db" })
  .then(() => console.log("✅ MongoDB connected (Matching Service)"))
  .catch((err) => console.error("❌ DB connection error:", err));


app.use("/api/matching", matchingRoutes);

startMatchingGrpc();


const PORT = process.env.PORT || 4006;

app.listen(PORT, () =>
  console.log(`🎯 Matching HTTP service running on port ${PORT}`)
);
