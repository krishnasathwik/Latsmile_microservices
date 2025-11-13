import Rider from "../models/riderModel.js";
import { authClient, stationClient, matchingClient } from "../grpc/clients.js";

// ---------------- Register Rider ----------------

export const registerRider = async (req, res) => {
  try {
    const { email, boardingStationName, destinationStationName, arrivalTime } = req.body;

    if (!email || !boardingStationName || !destinationStationName || !arrivalTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ 1. Fetch user info (must be rider)
    const user = await new Promise((resolve, reject) => {
      authClient.GetUserByEmail({ email }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });

    if (user.status !== "success" || user.role !== "rider") {
      return res.status(403).json({ message: "User is not a rider." });
    }

    const riderName = user.username;

    // ✅ 2. Fetch boarding station coordinates
    const boardingStation = await new Promise((resolve) => {
      stationClient.GetLocationByName({ name: boardingStationName }, (err, res) => {
        if (err || !res?.latitude) {
          return resolve({
            name: boardingStationName,
            latitude: 0,
            longitude: 0,
          });
        }
        resolve(res);
      });
    });

    // ✅ 3. Fetch destination station coordinates
    const destinationStation = await new Promise((resolve) => {
      stationClient.GetLocationByName({ name: destinationStationName }, (err, res) => {
        if (err || !res?.latitude) {
          return resolve({
            name: destinationStationName,
            latitude: 0,
            longitude: 0,
          });
        }
        resolve(res);
      });
    });

    // ✅ 4. Check existing rider
    const existing = await Rider.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Rider already registered." });
    }

    // -----------------------------------------
    // 5️⃣ Create rider with status = waiting
    // -----------------------------------------
    const rider = await Rider.create({
      name: riderName,
      email,
      boardingStation: {
        name: boardingStation.name,
        latitude: boardingStation.latitude,
        longitude: boardingStation.longitude,
      },
      destinationStation: {
        name: destinationStation.name,
        latitude: destinationStation.latitude,
        longitude: destinationStation.longitude,
      },
      arrivalTime,
      rideStatus: "waiting",
    });

    // -----------------------------------------
    // 6️⃣ Trigger MATCHING SERVICE (important)
    // -----------------------------------------
    try {
      const matchRes = await new Promise((resolve, reject) => {
        matchingClient.MatchRider({ email }, (err, response) => {
          if (err) return reject(err);
          resolve(response);
        });
      });

      console.log("MATCH RESPONSE:", matchRes);

      if (matchRes.status === "success") {
        // 🔥 Update rider with matched driver
        rider.rideStatus = "matched";
        rider.assignedDriver = matchRes.driverEmail;
        await rider.save();
      }
    } catch (err) {
      console.error("❌ MatchingService error:", err.message);
    }

    // -----------------------------------------
    // 7️⃣ Send response back
    // -----------------------------------------
    return res.status(201).json({
      message: "Rider registered successfully",
      rider,
    });

  } catch (error) {
    console.error("registerRider error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
