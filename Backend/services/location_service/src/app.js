import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import locationRoutes from "./routes/locationRoutes.js";
import { startGrpcServer } from "./grpc/server.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/location", locationRoutes);

connectDB();
startGrpcServer();

import "./simulator/driverSimulator.js";


app.listen(4004, () =>
  console.log("🌍 Location HTTP API running on port 4004")
);
