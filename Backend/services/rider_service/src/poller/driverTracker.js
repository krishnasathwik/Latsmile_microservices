import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import Rider from "../models/riderModel.js";
import { calculateDistanceKm } from "../utils/distanceCalc.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MATCH_PROTO = path.resolve(__dirname, "../../../protos/matching.proto");
const LOC_PROTO = path.resolve(__dirname, "../../../protos/location.proto");

// Load proto
const matchDef = protoLoader.loadSync(MATCH_PROTO, { keepCase: true, defaults: true });
const locDef = protoLoader.loadSync(LOC_PROTO, { keepCase: true, defaults: true });

const matchingProto = grpc.loadPackageDefinition(matchDef).matching;
const locationProto = grpc.loadPackageDefinition(locDef).location;

// Clients
const matchingClient = new matchingProto.MatchingService(
  "localhost:50056",
  grpc.credentials.createInsecure()
);

const locationClient = new locationProto.LocationService(
  "localhost:50055",
  grpc.credentials.createInsecure()
);

// Promise wrapper
function grpcCall(client, method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}



// ----------------------------------------------------------
//  🔥 EXISTING DRIVER POLLER (kept untouched)
// ----------------------------------------------------------
export function startDriverTracker() {
  console.log("🚀 Driver tracking started...");

  setInterval(async () => {
    try {
      const matchedRiders = await Rider.find({ rideStatus: "matched" });
      if (matchedRiders.length === 0) return;

      for (let rider of matchedRiders) {

        // Step 1: get match info
        const matchRes = await grpcCall(matchingClient, "GetMatchByEmail", {
          email: rider.email,
        });

        if (matchRes.status !== "success") continue;
        const driverEmail = matchRes.driverEmail;

        // Step 2: get driver location
        const locRes = await grpcCall(locationClient, "GetLocation", {
          email: driverEmail,
        });

        if (!locRes.latitude || !locRes.longitude) continue;

        const driverLat = locRes.latitude;
        const driverLong = locRes.longitude;

        // Step 3: get rider's boarding location
        const riderLat = rider.boardingStation.latitude;
        const riderLong = rider.boardingStation.longitude;

        // Step 4: compute distance
        const distance = calculateDistanceKm(riderLat, riderLong, driverLat, driverLong);

        console.log(
          `📍 Rider: ${rider.email} | Driver: ${driverEmail} | Distance: ${distance.toFixed(2)} km`
        );

        // (OPTIONAL) You store here, but not required
        rider.currentDriverDistance = distance;
        await rider.save();

        // Step 5: auto-set completed when near rider
        if (distance < 0.05) {
          console.log(`✅ Driver has reached rider ${rider.email}`);

          rider.rideStatus = "completed";
          await rider.save();

          await grpcCall(matchingClient, "UpdateMatchStatus", {
            riderEmail: rider.email,
            status: "completed",
          });

          console.log(`✅ Ride completed for rider ${rider.email}`);
        }
      }
    } catch (err) {
      console.error("❌ Error in driver tracker:", err.message);
    }
  }, 10000);
}



// ----------------------------------------------------------
//  ⭐ NEW: LIVE DISTANCE API — NO DB STORAGE
// ----------------------------------------------------------
export const getLiveDistance = async (req, res) => {
  try {
    const { riderEmail } = req.query;

    if (!riderEmail) {
      return res.status(400).json({
        status: "error",
        message: "riderEmail is required",
      });
    }

    // 1️⃣ Fetch rider
    const rider = await Rider.findOne({ email: riderEmail });
    if (!rider) {
      return res.status(404).json({
        status: "error",
        message: "Rider not found",
      });
    }

    // 2️⃣ Get matched driver
    const matchRes = await grpcCall(matchingClient, "GetMatchByEmail", {
      email: riderEmail,
    });

    if (!matchRes || matchRes.status !== "success") {
      return res.status(200).json({
        status: "pending",
        message: "Driver not assigned yet",
        distanceKm: null,
      });
    }

    const driverEmail = matchRes.driverEmail;

    // 3️⃣ Get driver's live location
    const locRes = await grpcCall(locationClient, "GetLocation", {
      email: driverEmail,
    });

    if (!locRes.latitude || !locRes.longitude) {
      return res.status(200).json({
        status: "pending",
        message: "Driver location unavailable",
        distanceKm: null,
      });
    }

    const driverLat = locRes.latitude;
    const driverLong = locRes.longitude;

    // 4️⃣ Rider coordinates
    const riderLat = rider.boardingStation.latitude;
    const riderLong = rider.boardingStation.longitude;

    // 5️⃣ Compute distance
    const distanceKm = calculateDistanceKm(riderLat, riderLong, driverLat, driverLong);

    // ⭐ FINAL RESPONSE — includes driverLat & driverLong
    return res.status(200).json({
      status: "success",
      driverEmail,
      driverLat,
      driverLong,
      distanceKm,
    });

  } catch (err) {
    console.error("❌ getLiveDistance ERROR:", err.message);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
