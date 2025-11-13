import express from "express";
import { registerRider } from "../controllers/riderController.js";
import { isRider } from "../../../../common/middleware/roleMiddleware.js";
import { getLiveDistance } from "../poller/driverTracker.js";

const router = express.Router();

// Rider registers their ride request
router.post("/register_rider", isRider, registerRider);
router.get("/distance", getLiveDistance);

export default router;
