import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import driverRoutes from "./routes/driverRoutes.js";
import { startGrpcServer } from "./grpc/server.js"; 
import cors from "cors"; // ✅ ADD THIS

dotenv.config();
const app = express();

app.use(express.json());

// ✅ Connect MongoDB
connectDB();

app.use(cors());
// ✅ Start gRPC server
startGrpcServer();  // ✅ IMPORTANT

// ✅ HTTP routes (for Postman testing)
app.use("/api/driver", driverRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`🚗 Driver Service running on port ${PORT}`));
