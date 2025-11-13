import express from "express";
import { addStation, getStations, getNearby } from "../controllers/stationController.js";

import {isRider} from "../../../../common/middleware/roleMiddleware.js";
 

const router = express.Router();

router.post("/add", addStation);
router.get("/all",getStations);
router.get("/nearby/:stationName",isRider, getNearby);

export default router;
