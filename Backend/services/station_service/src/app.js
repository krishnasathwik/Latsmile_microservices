import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import stationRoutes from "./routes/stationRoutes.js";
import { startGrpcServer } from "./grpc/server.js";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());

// connect to MongoDB
connectDB();

app.use(cors());

// mount routes
app.use("/api/stations", stationRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚉 Station Service running on port ${PORT}`));
startGrpcServer();

