import Driver from "../models/driverModel.js";
import { authClient } from "../grpc/client.js";
import { stationClient } from "../grpc/client.js";

/**
 * 🚗 Register Driver
 *  - Verifies the user from Auth Service (must be a verified "driver")
 *  - Fetches coordinates from Station Service for each selected route place
 *  - Saves driver info into MongoDB
 */
export const registerDriver = async (req, res) => {
  try {
    const { email, carNumber, totalSeats, availableSeats, routeNames } = req.body;

    if (!email || !carNumber || !totalSeats || !availableSeats || !routeNames?.length) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ 1. Verify driver identity via Auth Service (gRPC)
    const user = await new Promise((resolve, reject) => {
      authClient.GetUserByEmail({ email }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });

    if (user.status !== "success" || user.role !== "driver") {
      return res.status(403).json({ message: "User is not a verified driver." });
    }

    const driverName = user.username;

    // ✅ 2. Fetch coordinates for each place in route from Station Service (gRPC)
    const routeDetails = await Promise.all(
      routeNames.map(
        (place) =>
          new Promise((resolve, reject) => {
            stationClient.GetLocationByName({ name: place }, (err, response) => {
              if (err || !response?.latitude) {
                console.warn(` Could not fetch coordinates for ${place}`);
                return resolve({ place, latitude: 0, longitude: 0 }); // fallback
              }
              resolve({
                place: response.name,
                latitude: response.latitude,
                longitude: response.longitude,
              });
            });
          })
      )
    );

    // ✅ 3. Save driver in DB
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver already registered." });
    }

    const driver = new Driver({
      name: driverName,
      email,
      carNumber,
      totalSeats,
      availableSeats,
      route: routeDetails,
      status: "available",
    });

    await driver.save();

    return res.status(201).json({
      message: "Driver registered successfully ",
      driver,
    });
  } catch (error) {
    console.error(" registerDriver error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * 📍 Update Driver Location
 *  - Called periodically as driver moves
 */
export const updateDriverLocation = async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;

    if (!email || !latitude || !longitude) {
      return res.status(400).json({ message: "Email, latitude and longitude are required." });
    }

    const driver = await Driver.findOneAndUpdate(
      { email },
      { currentLocation: { latitude, longitude, updatedAt: new Date() } },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    res.status(200).json({
      message: "Driver location updated successfully ",
      location: driver.currentLocation,
    });
  } catch (error) {
    console.error(" updateDriverLocation error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * 🚦 Change Driver Status
 *  - Allows setting driver as available / on_trip / inactive
 */
export const updateDriverStatus = async (req, res) => {
  try {
    const { email, status } = req.body;

    if (!email || !["available", "on_trip", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status or email." });
    }

    const driver = await Driver.findOneAndUpdate({ email }, { status }, { new: true });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    res.status(200).json({
      message: `Driver status updated to ${status}`,
      driver,
    });
  } catch (error) {
    console.error(" updateDriverStatus error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
