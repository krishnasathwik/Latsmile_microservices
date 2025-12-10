// import grpc from "@grpc/grpc-js";
// import { riderClient, driverClient, locationClient } from "../grpc/client.js";
// import { calculateDistanceKm } from "../utils/distanceCalc.js";
// import { sendMailToDriver, sendMailToRider } from "../utils/notify.js";
// import Match from "../models/matchModel.js";

// // Helper: convert callback into Promise
// function grpcCall(client, method, payload) {
//   return new Promise((resolve, reject) => {
//     client[method](payload, (err, res) => {
//       if (err) return reject(err);
//       resolve(res);
//     });
//   });
// }

// /* ----------------------------------------------------------
//  ✅ MATCH RIDER
// ----------------------------------------------------------- */
// export const matchRiderLogic = async (call, callback) => {
//   try {
//     const { email: riderEmail } = call.request;

//     const rider = await grpcCall(riderClient, "GetRiderByEmail", { email: riderEmail });
//     if (rider.status !== "success") {
//       return callback(null, { status: "error", message: "Rider not found" });
//     }

//     const riderLat = rider.boardingLatitude;
//     const riderLong = rider.boardingLongitude;

//     const driverLocations = await grpcCall(locationClient, "GetAllLocations", {});
//     if (!driverLocations.locations || driverLocations.locations.length === 0) {
//       return callback(null, { status: "error", message: "No active drivers" });
//     }

//     let nearestDriver = null;
//     let minDistance = Infinity;

//     for (const loc of driverLocations.locations) {
//       const dist = calculateDistanceKm(riderLat, riderLong, loc.latitude, loc.longitude);
//       if (dist < minDistance) {
//         nearestDriver = loc.email;
//         minDistance = dist;
//       }
//     }

//     const driver = await grpcCall(driverClient, "GetDriverByEmail", {
//       email: nearestDriver,
//     });

//     if (driver.status !== "success") {
//       return callback(null, { status: "error", message: "Driver details not found" });
//     }

//     if (driver.statusText !== "available") {
//       return callback(null, { status: "error", message: "Driver is not available" });
//     }

//     await sendMailToDriver(driver, rider, minDistance);
//     await sendMailToRider(rider, driver, minDistance);

//     await grpcCall(riderClient, "UpdateRideStatus", {
//       email: rider.email,
//       status: "matched",
//     });

//     await Match.findOneAndUpdate(
//       { riderEmail: rider.email },
//       {
//         riderEmail: rider.email,
//         driverEmail: driver.email,
//         status: "active",
//         matchedAt: new Date(),
//       },
//       { upsert: true }
//     );

//     callback(null, {
//       status: "success",
//       message: "Driver assigned successfully",
//       riderEmail: rider.email,
//       driverEmail: driver.email,
//       distanceKm: minDistance,
//     });

//   } catch (err) {
//     console.error("Matching error:", err);
//     callback({
//       code: grpc.status.INTERNAL,
//       message: "Matching service failed",
//     });
//   }
// };

// /* ----------------------------------------------------------
//  ✅ GET MATCH BY RIDER EMAIL
// ----------------------------------------------------------- */
// export const getMatchByEmailLogic = async (call, callback) => {
//   try {
//     const { email } = call.request;

//     const match = await Match.findOne({ riderEmail: email });

//     if (!match) {
//       return callback(null, {
//         status: "error",
//         message: "No match found",
//         driverEmail: "",
//       });
//     }

//     callback(null, {
//       status: "success",
//       message: "Match found",
//       driverEmail: match.driverEmail,
//     });

//   } catch (err) {
//     console.error("GetMatchByEmail error:", err);
//     callback({
//       code: grpc.status.INTERNAL,
//       message: "Failed to retrieve match",
//     });
//   }
// };

// /* ----------------------------------------------------------
//  ✅ UPDATE MATCH STATUS (completed / cancelled)
// ----------------------------------------------------------- */
// export const updateMatchStatusLogic = async (call, callback) => {
//   try {
//     const { email, status } = call.request;
//     const riderEmail = email;


//     // ✅ Validate status
//     if (!["completed", "cancelled"].includes(status)) {
//       return callback(null, {
//         status: "error",
//         message: "Invalid status. Use completed or cancelled."
//       });
//     }

//     // ✅ Update match record
//     const updated = await Match.findOneAndUpdate(
//       { riderEmail },
//       { status, endedAt: new Date() },
//       { new: true }
//     );

//     if (!updated) {
//       return callback(null, {
//         status: "error",
//         message: "No match found to update"
//       });
//     }

//     // ✅ Update rider ride status in Rider service
//     await grpcCall(riderClient, "UpdateRideStatus", {
//       email: riderEmail,
//       status,
//     });

//     // ✅ Optional: Notify both parties
//     try {
//       await sendMailToDriver({ email: updated.driverEmail }, { email: riderEmail }, 0);
//       await sendMailToRider({ email: riderEmail }, { email: updated.driverEmail }, 0);
//     } catch (notifyErr) {
//       console.warn("⚠ Email sending failed:", notifyErr.message);
//     }

//     callback(null, {
//       status: "success",
//       message: `Match status updated to ${status}`,
//     });

//   } catch (err) {
//     console.error("UpdateMatchStatus error:", err);
//     callback({
//       code: grpc.status.INTERNAL,
//       message: "Failed to update match status",
//     });
//   }
// };


import grpc from "@grpc/grpc-js";
import { riderClient, driverClient, locationClient } from "../grpc/client.js";
import { calculateDistanceKm } from "../utils/distanceCalc.js";
import { sendMailToDriver, sendMailToRider } from "../utils/notify.js";
import Match from "../models/matchModel.js";

// Helper: convert callback into Promise
function grpcCall(client, method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

/* ----------------------------------------------------------
 ✅ MATCH RIDER
----------------------------------------------------------- */
/* ----------------------------------------------------------
 ✅ MATCH RIDER — route-aware with FULL DEBUG LOGS
----------------------------------------------------------- */

const ROUTE_MATCH_THRESHOLD_KM = 0.2; // boarding/destination must be near a route point
const PICKUP_ELIGIBILITY_THRESHOLD_KM = 0.15;

function findClosestRouteIndex(route, lat, long) {
  if (!Array.isArray(route) || route.length === 0) return { index: -1, dist: Infinity };

  let bestIndex = -1;
  let bestDist = Infinity;

  for (let i = 0; i < route.length; i++) {
    const p = route[i];
    const d = calculateDistanceKm(lat, long, p.latitude, p.longitude);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  return { index: bestIndex, dist: bestDist };
}

export const matchRiderLogic = async (call, callback) => {
  try {
    console.log("\n\n================= 🚀 MATCH RIDER START =================");

    const { email: riderEmail } = call.request;
    console.log(`🔎 Fetching rider: ${riderEmail}`);

    // 1️⃣ Fetch rider
    const rider = await grpcCall(riderClient, "GetRiderByEmail", { email: riderEmail });
    console.log("📡 Rider Data →", rider);

    if (!rider || rider.status !== "success") {
      console.log("❌ Rider not found");
      return callback(null, { status: "error", message: "Rider not found" });
    }

    const riderBoardLat = rider.boardingStation?.latitude ?? rider.boardingLatitude;
    const riderBoardLong = rider.boardingStation?.longitude ?? rider.boardingLongitude;
    const riderDestLat = rider.destinationStation?.latitude ?? rider.destinationLatitude;
    const riderDestLong = rider.destinationStation?.longitude ?? rider.destinationLongitude;

    console.log(`📍 Rider boarding=(${riderBoardLat}, ${riderBoardLong})`);
    console.log(`📍 Rider destination=(${riderDestLat}, ${riderDestLong})`);

    if (!riderBoardLat || !riderBoardLong || !riderDestLat || !riderDestLong) {
      console.log("❌ Missing coordinates");
      return callback(null, { status: "error", message: "Rider coordinates missing" });
    }

    // 2️⃣ Fetch all drivers
    const driverLocations = await grpcCall(locationClient, "GetAllLocations", {});
    console.log(`🚌 Active driver locations count = ${driverLocations.locations.length}`);

    let bestDriver = null;
    let bestDistance = Infinity;

    // 3️⃣ Evaluate each driver
    for (const loc of driverLocations.locations) {
      console.log("\n------------------------------------------------");
      console.log(`🚖 Checking driver: ${loc.email}`);
      console.log(`📡 Driver current position = (${loc.latitude}, ${loc.longitude})`);

      try {
        const driver = await grpcCall(driverClient, "GetDriverByEmail", { email: loc.email });
        console.log("📡 Driver details →", driver);

        if (!driver || driver.status !== "success") {
          console.log("❌ Driver not found in DB — skipping");
          continue;
        }

        if (driver.statusText !== "available") {
          console.log("❌ Driver is not available — skipping");
          continue;
        }

        if (!Array.isArray(driver.route) || driver.route.length === 0) {
          console.log("❌ Driver has no route — skipping");
          continue;
        }

        const route = driver.route;

        // 🌐 Project coordinates onto route
        const driverProj = findClosestRouteIndex(route, loc.latitude, loc.longitude);
        const boardingProj = findClosestRouteIndex(route, riderBoardLat, riderBoardLong);
        const destProj = findClosestRouteIndex(route, riderDestLat, riderDestLong);

        console.log(`📍 Route projection results:`);
        console.log(`   Driver closest route index = ${driverProj.index}, dist = ${driverProj.dist.toFixed(3)} km`);
        console.log(`   Boarding closest route index = ${boardingProj.index}, dist = ${boardingProj.dist.toFixed(3)} km`);
        console.log(`   Destination closest route index = ${destProj.index}, dist = ${destProj.dist.toFixed(3)} km`);

        // ❌ Must be near route
        if (boardingProj.dist > ROUTE_MATCH_THRESHOLD_KM) {
          console.log("❌ Boarding too far from route — skipping driver");
          continue;
        }
        if (destProj.dist > ROUTE_MATCH_THRESHOLD_KM) {
          console.log("❌ Destination too far from route — skipping driver");
          continue;
        }

        // ❌ Must follow route order
        if (destProj.index <= boardingProj.index) {
          console.log("❌ Destination comes before boarding on route — invalid route — skipping");
          continue;
        }

        // ❌ Driver must not have passed boarding
        if (driverProj.index > boardingProj.index) {
          console.log("❌ Driver already passed the boarding point — skipping");
          continue;
        }

        // ✔ Driver is eligible → compute distance to boarding
        const distToBoarding = calculateDistanceKm(
          riderBoardLat,
          riderBoardLong,
          loc.latitude,
          loc.longitude
        );
        console.log(`   → Distance to rider boarding = ${distToBoarding.toFixed(3)} km`);

        if (distToBoarding < bestDistance) {
          console.log("   ⭐ This driver is currently the best match");
          bestDistance = distToBoarding;
          bestDriver = driver;
        }

      } catch (err) {
        console.log("❌ Error processing driver:", err);
      }
    }

    // 4️⃣ Final decision
    if (!bestDriver) {
      console.log("❌ No eligible drivers that match the route");
      return callback(null, { status: "error", message: "No suitable drivers on route" });
    }

    console.log("\n================= 🎉 MATCH FOUND =================");
    console.log(`🧍 Rider → ${rider.email}`);
    console.log(`🚖 Driver → ${bestDriver.email}`);
    console.log(`📏 Distance to boarding → ${bestDistance.toFixed(3)} km`);
    console.log("=================================================\n");

    // Perform assignment
    await sendMailToDriver(bestDriver, rider, bestDistance);
    await sendMailToRider(rider, bestDriver, bestDistance);

    await grpcCall(riderClient, "UpdateRideStatus", {
      email: rider.email,
      status: "matched",
    });

    await Match.findOneAndUpdate(
      { riderEmail: rider.email },
      {
        riderEmail: rider.email,
        driverEmail: bestDriver.email,
        status: "active",
        matchedAt: new Date(),
      },
      { upsert: true }
    );

    callback(null, {
      status: "success",
      message: "Driver assigned successfully",
      riderEmail: rider.email,
      driverEmail: bestDriver.email,
      distanceKm: bestDistance,
    });

  } catch (err) {
    console.error("❌ Matching error:", err);
    callback({
      code: grpc.status.INTERNAL,
      message: "Matching service failed",
    });
  }
};

/* ----------------------------------------------------------
 ✅ GET MATCH BY RIDER EMAIL
----------------------------------------------------------- */
export const getMatchByEmailLogic = async (call, callback) => {
  try {
    const { email } = call.request;

    const match = await Match.findOne({ riderEmail: email });

    if (!match) {
      return callback(null, {
        status: "error",
        message: "No match found",
        driverEmail: "",
        matchStatus: "",
      });
    }

    callback(null, {
      status: "success",
      message: "Match found",
      driverEmail: match.driverEmail,
      matchStatus: match.status || "",
    });

  } catch (err) {
    console.error("GetMatchByEmail error:", err);
    callback({
      code: grpc.status.INTERNAL,
      message: "Failed to retrieve match",
    });
  }
};

/* ----------------------------------------------------------
 ✅ UPDATE MATCH STATUS (completed / cancelled)
----------------------------------------------------------- */
export const updateMatchStatusLogic = async (call, callback) => {
  try {
    const { email, status } = call.request;
    const riderEmail = email;

    if (!["completed", "cancelled", "active"].includes(status)) {
      return callback(null, {
        status: "error",
        message: "Invalid status. Use active, completed or cancelled.",
      });
    }

    const updated = await Match.findOneAndUpdate(
      { riderEmail },
      { status, endedAt: status === "completed" ? new Date() : undefined },
      { new: true }
    );

    if (!updated) {
      return callback(null, {
        status: "error",
        message: "No match found to update",
      });
    }

    // Note: rider rideStatus is updated by Matching service (manual calls)
    // or automatically by Location service when trip completes.

    try {
      await sendMailToDriver({ email: updated.driverEmail }, { email: riderEmail }, 0);
      await sendMailToRider({ email: riderEmail }, { email: updated.driverEmail }, 0);
    } catch (notifyErr) {
      console.warn("⚠ Email sending failed:", notifyErr.message);
    }

    callback(null, {
      status: "success",
      message: `Match status updated to ${status}`,
    });

  } catch (err) {
    console.error("UpdateMatchStatus error:", err);
    callback({
      code: grpc.status.INTERNAL,
      message: "Failed to update match status",
    });
  }
};

/* ----------------------------------------------------------
 ✅ NEW: GET ACTIVE MATCH BY DRIVER EMAIL (1 rider per driver)
----------------------------------------------------------- */
export const getActiveMatchByDriverLogic = async (call, callback) => {
  try {
    const { email } = call.request; // driver email

    const match = await Match.findOne({ driverEmail: email, status: "active" });

    if (!match) {
      return callback(null, {
        status: "error",
        message: "No active match for this driver",
        riderEmail: "",
        matchStatus: "",
      });
    }

    callback(null, {
      status: "success",
      message: "Active match found",
      riderEmail: match.riderEmail,
      matchStatus: match.status || "active",
    });

  } catch (err) {
    console.error("GetActiveMatchByDriver error:", err);
    callback({
      code: grpc.status.INTERNAL,
      message: "Failed to retrieve active match by driver",
    });
  }
};
