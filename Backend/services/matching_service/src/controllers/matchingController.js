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
export const matchRiderLogic = async (call, callback) => {
  try {
    const { email: riderEmail } = call.request;

    const rider = await grpcCall(riderClient, "GetRiderByEmail", { email: riderEmail });
    if (rider.status !== "success") {
      return callback(null, { status: "error", message: "Rider not found" });
    }

    const riderLat = rider.boardingLatitude;
    const riderLong = rider.boardingLongitude;

    const driverLocations = await grpcCall(locationClient, "GetAllLocations", {});
    if (!driverLocations.locations || driverLocations.locations.length === 0) {
      return callback(null, { status: "error", message: "No active drivers" });
    }

    let nearestDriver = null;
    let minDistance = Infinity;

    for (const loc of driverLocations.locations) {
      const dist = calculateDistanceKm(riderLat, riderLong, loc.latitude, loc.longitude);
      if (dist < minDistance) {
        nearestDriver = loc.email;
        minDistance = dist;
      }
    }

    const driver = await grpcCall(driverClient, "GetDriverByEmail", {
      email: nearestDriver,
    });

    if (driver.status !== "success") {
      return callback(null, { status: "error", message: "Driver details not found" });
    }

    if (driver.statusText !== "available") {
      return callback(null, { status: "error", message: "Driver is not available" });
    }

    await sendMailToDriver(driver, rider, minDistance);
    await sendMailToRider(rider, driver, minDistance);

    await grpcCall(riderClient, "UpdateRideStatus", {
      email: rider.email,
      status: "matched",
    });

    await Match.findOneAndUpdate(
      { riderEmail: rider.email },
      {
        riderEmail: rider.email,
        driverEmail: driver.email,
        status: "active",
        matchedAt: new Date(),
      },
      { upsert: true }
    );

    callback(null, {
      status: "success",
      message: "Driver assigned successfully",
      riderEmail: rider.email,
      driverEmail: driver.email,
      distanceKm: minDistance,
    });

  } catch (err) {
    console.error("Matching error:", err);
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
      });
    }

    callback(null, {
      status: "success",
      message: "Match found",
      driverEmail: match.driverEmail,
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


    // ✅ Validate status
    if (!["completed", "cancelled"].includes(status)) {
      return callback(null, {
        status: "error",
        message: "Invalid status. Use completed or cancelled."
      });
    }

    // ✅ Update match record
    const updated = await Match.findOneAndUpdate(
      { riderEmail },
      { status, endedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return callback(null, {
        status: "error",
        message: "No match found to update"
      });
    }

    // ✅ Update rider ride status in Rider service
    await grpcCall(riderClient, "UpdateRideStatus", {
      email: riderEmail,
      status,
    });

    // ✅ Optional: Notify both parties
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
