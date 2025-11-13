
import "./grpc/server.js";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import path from "path";


dotenv.config({ path: path.resolve("./.env") });

const app = express();
app.use(express.json());

app.use(cors());

// connect to db + start gRPC
connectDB();


// express routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(` Auth HTTP server running on port ${PORT}`));
