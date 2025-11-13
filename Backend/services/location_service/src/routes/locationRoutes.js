import express from "express";
import {
  updateLocation,
  getLocation,
  getAllLocations
} from "../controllers/locationController.js";

const router = express.Router();

router.post("/update_location", updateLocation);
router.get("/all_locations", getAllLocations);
router.get("/:email", getLocation);

export default router;
