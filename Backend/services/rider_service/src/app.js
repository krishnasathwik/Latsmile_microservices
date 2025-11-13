import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import riderRoutes from "./routes/riderRoutes.js";
import { startGrpcServer } from "./grpc/server.js";
import { startDriverTracker } from "./poller/driverTracker.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(/.*/, cors());
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGO_URI, { dbName: "lastmile_db" })
  .then(() => console.log(" MongoDB connected (Rider Service)"))
  .catch((err) => console.error("DB error:", err));

// Routes
app.use("/api/rider", riderRoutes);

// Start gRPC server
startGrpcServer();
startDriverTracker();

// Start HTTP server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`🚖 Rider Service listening on port ${PORT}`);
});
