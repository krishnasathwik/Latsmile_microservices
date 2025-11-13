import express from "express";
import {
  registerDriver,
  updateDriverLocation,
  updateDriverStatus,
} from "../controllers/driverController.js";
import { isDriver } from "../../../../common/middleware/roleMiddleware.js";
 

const router = express.Router();

/**
 * @route   POST /api/drivers/register
 * @desc    Register a new driver
 * @access  Protected (Driver only)
 */
router.post("/register_driver", isDriver, registerDriver);

/**
 * @route   PUT /api/drivers/location
 * @desc    Update driver's current location
 * @access  Protected (Driver only)
 */
router.put("/location_driver", isDriver, updateDriverLocation);

/**
 * @route   PUT /api/drivers/status
 * @desc    Update driver's status (available/on_trip/inactive)
 * @access  Protected (Driver only)
 */
router.put("/status_driver", isDriver, updateDriverStatus);

export default router;
