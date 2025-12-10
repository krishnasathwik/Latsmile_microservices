// // // import grpc from "@grpc/grpc-js";
// // // import protoLoader from "@grpc/proto-loader";
// // // import Location from "../models/locationModel.js";

// // // import path from "path";
// // // import { fileURLToPath } from "url";

// // // const __filename = fileURLToPath(import.meta.url);
// // // const __dirname = path.dirname(__filename);

// // // const PROTO_PATH = path.resolve(__dirname, "../../../protos/location.proto");

// // // const packageDef = protoLoader.loadSync(PROTO_PATH, {
// // //   keepCase: true,
// // //   longs: String,
// // //   enums: String,
// // //   defaults: true,
// // //   oneofs: true,
// // // });

// // // const locationProto = grpc.loadPackageDefinition(packageDef).location;

// // // const locationService = {
// // //   UpdateLocation: async (call, callback) => {
// // //     try {
// // //       const { email, latitude, longitude } = call.request;

// // //       const updated = await Location.findOneAndUpdate(
// // //         { email },
// // //         { latitude, longitude, updatedAt: new Date() },
// // //         { new: true, upsert: true }
// // //       );

// // //       callback(null, {
// // //         email,
// // //         latitude,
// // //         longitude,
// // //         updatedAt: updated.updatedAt.toISOString(),
// // //         status: "success",
// // //         message: "Location updated"
// // //       });
// // //     } catch (err) {
// // //       callback({
// // //         code: grpc.status.INTERNAL,
// // //         message: "Error updating location"
// // //       });
// // //     }
// // //   },

// // //   GetLocation: async (call, callback) => {
// // //     try {
// // //       const { email } = call.request;
// // //       const loc = await Location.findOne({ email });

// // //       if (!loc) return callback(null, {
// // //         status: "error",
// // //         message: "Location not found"
// // //       });

// // //       callback(null, {
// // //         email,
// // //         latitude: loc.latitude,
// // //         longitude: loc.longitude,
// // //         updatedAt: loc.updatedAt.toISOString(),
// // //         status: "success",
// // //         message: "Location fetched"
// // //       });
// // //     } catch (err) {
// // //       callback({
// // //         code: grpc.status.INTERNAL,
// // //         message: "Error fetching location"
// // //       });
// // //     }
// // //   },

// // //   GetAllLocations: async (_, callback) => {
// // //     try {
// // //       const locs = await Location.find();

// // //       const formatted = locs.map(loc => ({
// // //         email: loc.email,
// // //         latitude: loc.latitude,
// // //         longitude: loc.longitude,
// // //         updatedAt: loc.updatedAt.toISOString(),
// // //         status: "success",
// // //         message: "Location fetched"
// // //       }));

// // //       callback(null, { locations: formatted });
// // //     } catch (err) {
// // //       callback({
// // //         code: grpc.status.INTERNAL,
// // //         message: "Error fetching locations"
// // //       });
// // //     }
// // //   }
// // // };

// // // export const startGrpcServer = () => {
// // //   const server = new grpc.Server();
// // //   server.addService(locationProto.LocationService.service, locationService);

// // //   server.bindAsync("0.0.0.0:50055", grpc.ServerCredentials.createInsecure(), (err, port) => {
// // //     if (err) console.error(err);
// // //     else {
// // //       server.start();
// // //       console.log(`📍 Location gRPC server running on port ${port}`);
// // //     }
// // //   });
// // // };

// // import grpc from "@grpc/grpc-js";
// // import protoLoader from "@grpc/proto-loader";
// // import Location from "../models/locationModel.js";
// // import { calculateDistanceKm } from "../utils/distanceCalc.js";
// // import { riderClient, driverClient, matchingClient } from "../grpc/client.js";
// // import path from "path";
// // import { fileURLToPath } from "url";

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // const PROTO_PATH = path.resolve(__dirname, "../../../protos/location.proto");

// // const pkgDef = protoLoader.loadSync(PROTO_PATH, {
// //   keepCase: true,
// //   longs: String,
// //   enums: String,
// //   defaults: true,
// //   oneofs: true,
// // });

// // const locationProto = grpc.loadPackageDefinition(pkgDef).location;

// // function grpcCall(client, method, payload) {
// //   return new Promise((resolve, reject) => {
// //     client[method](payload, (err, res) => {
// //       if (err) return reject(err);
// //       resolve(res);
// //     });
// //   });
// // }

// // const locationService = {
// //   UpdateLocation: async (call, callback) => {
// //     try {
// //       const { email, latitude, longitude } = call.request;

// //       // 1️⃣ Update driver location in DB
// //       const updated = await Location.findOneAndUpdate(
// //         { email },
// //         { latitude, longitude, updatedAt: new Date() },
// //         { new: true, upsert: true }
// //       );

// //       // 2️⃣ Ask Matching Service → which rider is assigned to this driver?
// //       const matchRes = await grpcCall(matchingClient, "GetActiveMatchByDriverEmail", {
// //         email,   // driver email
// //       });

// //       if (matchRes.status !== "success") {
// //         // no rider assigned → stop ride logic
// //         return callback(null, {
// //           email,
// //           latitude,
// //           longitude,
// //           updatedAt: updated.updatedAt.toISOString(),
// //           status: "success",
// //           message: "Location updated",
// //         });
// //       }

// //       const riderEmail = matchRes.riderEmail;
// //       const rider = await grpcCall(riderClient, "GetRiderByEmail", { email: riderEmail });

// //       // ---- Pickup Detection (matched -> on_trip) ----
// //       const distToPickup = calculateDistanceKm(
// //         latitude, longitude,
// //         rider.boardingStation.latitude,
// //         rider.boardingStation.longitude
// //       );

// //       if (rider.rideStatus === "matched" && distToPickup <= 0.15) {
// //         await grpcCall(riderClient, "UpdateRideStatus", {
// //           email: rider.email,
// //           status: "on_trip",
// //         });
// //         console.log(`🟢 PICKUP → ${rider.email} ride started`);
// //       }

// //       // ---- Drop Detection (on_trip -> completed) ----
// //       const distToDrop = calculateDistanceKm(
// //         latitude, longitude,
// //         rider.destinationStation.latitude,
// //         rider.destinationStation.longitude
// //       );

// //       if (rider.rideStatus === "on_trip" && distToDrop <= 0.15) {
// //         await grpcCall(riderClient, "UpdateRideStatus", {
// //           email: rider.email,
// //           status: "completed",
// //         });

// //         await grpcCall(driverClient, "IncrementDriverSeat", { email });
// //         await grpcCall(matchingClient, "UpdateMatchStatus", {
// //           email: rider.email,
// //           status: "completed",
// //         });

// //         console.log(`🏁 DROP → ${rider.email} ride completed`);
// //       }

// //       // Response to HTTP request
// //       callback(null, {
// //         email,
// //         latitude,
// //         longitude,
// //         updatedAt: updated.updatedAt.toISOString(),
// //         status: "success",
// //         message: "Location updated",
// //       });

// //     } catch (err) {
// //       console.error("❌ UpdateLocation failed:", err);
// //       callback({
// //         code: grpc.status.INTERNAL,
// //         message: "Error updating location",
// //       });
// //     }
// //   },

// //   GetLocation: async (call, callback) => {
// //     try {
// //       const { email } = call.request;
// //       const loc = await Location.findOne({ email });

// //       if (!loc)
// //         return callback(null, { status: "error", message: "Location not found" });

// //       callback(null, {
// //         email,
// //         latitude: loc.latitude,
// //         longitude: loc.longitude,
// //         updatedAt: loc.updatedAt.toISOString(),
// //         status: "success",
// //         message: "Location fetched",
// //       });
// //     } catch {
// //       callback({
// //         code: grpc.status.INTERNAL,
// //         message: "Error fetching location",
// //       });
// //     }
// //   },

// //   GetAllLocations: async (_, callback) => {
// //     try {
// //       const locs = await Location.find();
// //       callback(null, {
// //         locations: locs.map((loc) => ({
// //           email: loc.email,
// //           latitude: loc.latitude,
// //           longitude: loc.longitude,
// //           updatedAt: loc.updatedAt.toISOString(),
// //           status: "success",
// //           message: "Location fetched",
// //         })),
// //       });
// //     } catch {
// //       callback({
// //         code: grpc.status.INTERNAL,
// //         message: "Error fetching locations",
// //       });
// //     }
// //   },
// // };

// // export const startGrpcServer = () => {
// //   const server = new grpc.Server();
// //   server.addService(locationProto.LocationService.service, locationService);

// //   server.bindAsync(
// //     "0.0.0.0:50055",
// //     grpc.ServerCredentials.createInsecure(),
// //     (err, port) => {
// //       if (err) console.error(err);
// //       else {
// //         server.start();
// //         console.log(`📍 Location gRPC server running on port ${port}`);
// //       }
// //     }
// //   );
// // };

// import grpc from "@grpc/grpc-js";
// import protoLoader from "@grpc/proto-loader";
// import Location from "../models/locationModel.js";
// import { calculateDistanceKm } from "../../../matching_service/src/utils/distanceCalc.js";
// import { riderClient, driverClient, matchingClient } from "../grpc/client.js";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const PROTO_PATH = path.resolve(__dirname, "../../../protos/location.proto");

// const pkgDef = protoLoader.loadSync(PROTO_PATH, {
//   keepCase: true,
//   longs: String,
//   enums: String,
//   defaults: true,
//   oneofs: true,
// });

// const locationProto = grpc.loadPackageDefinition(pkgDef).location;

// // Generic gRPC call helper
// function grpcCall(client, method, payload) {
//   return new Promise((resolve, reject) => {
//     client[method](payload, (err, res) => {
//       if (err) return reject(err);
//       resolve(res);
//     });
//   });
// }

// const locationService = {
//   UpdateLocation: async (call, callback) => {
//     try {
//       const { email, latitude, longitude } = call.request;

//       // 1️⃣ Update driver's location in DB
//       const updated = await Location.findOneAndUpdate(
//         { email },
//         { latitude, longitude, updatedAt: new Date() },
//         { new: true, upsert: true }
//       );

//       // 2️⃣ Get active match for this driver (1 rider per driver)
//       const matchRes = await grpcCall(matchingClient, "GetActiveMatchByDriverEmail", {
//         email,
//       });

//       if (!matchRes || matchRes.status !== "success" || !matchRes.riderEmail) {
//         return callback(null, {
//           email,
//           latitude,
//           longitude,
//           updatedAt: updated.updatedAt.toISOString(),
//           status: "success",
//           message: "Location updated",
//         });
//       }

//       const riderEmail = matchRes.riderEmail;
//       const rider = await grpcCall(riderClient, "GetRiderByEmail", { email: riderEmail });

//       // 🔹 Support both nested and flat fields safely
//       const boardingLat = rider.boardingStation?.latitude ?? rider.boardingLatitude ?? null;
//       const boardingLong = rider.boardingStation?.longitude ?? rider.boardingLongitude ?? null;
//       const destLat = rider.destinationStation?.latitude ?? rider.destinationLatitude ?? null;
//       const destLong = rider.destinationStation?.longitude ?? rider.destinationLongitude ?? null;

//       // If coordinates missing → skip ride logic, no crash
//       if (boardingLat == null || boardingLong == null || destLat == null || destLong == null) {
//         console.warn(
//           `⚠ Rider ${rider.email} missing boarding/destination coordinates → skipping pickup/drop logic`
//         );

//         return callback(null, {
//           email,
//           latitude,
//           longitude,
//           updatedAt: updated.updatedAt.toISOString(),
//           status: "success",
//           message: "Location updated",
//         });
//       }

//       // 🚕 Pickup Detection (matched → on_trip)
//       const distToPickup = calculateDistanceKm(latitude, longitude, boardingLat, boardingLong);
//       if (rider.rideStatus === "matched" && distToPickup <= 0.15) {
//         await grpcCall(riderClient, "UpdateRideStatus", {
//           email: rider.email,
//           status: "on_trip",
//         });
//         console.log(`🟢 PICKUP → ${rider.email} ride started`);
//       }

//       // 🏁 Drop Detection (on_trip → completed)
//       const distToDrop = calculateDistanceKm(latitude, longitude, destLat, destLong);
//       if (rider.rideStatus === "on_trip" && distToDrop <= 0.15) {
//         await grpcCall(riderClient, "UpdateRideStatus", {
//           email: rider.email,
//           status: "completed",
//         });

//         await grpcCall(driverClient, "IncrementDriverSeat", { email });

//         await grpcCall(matchingClient, "UpdateMatchStatus", {
//           email: rider.email,
//           status: "completed",
//         });

//         console.log(`🏁 DROP → ${rider.email} ride completed`);
//       }

//       callback(null, {
//         email,
//         latitude,
//         longitude,
//         updatedAt: updated.updatedAt.toISOString(),
//         status: "success",
//         message: "Location updated",
//       });
//     } catch (err) {
//       console.error("❌ UpdateLocation failed:", err);
//       callback({
//         code: grpc.status.INTERNAL,
//         message: "Error updating location",
//       });
//     }
//   },

//   GetLocation: async (call, callback) => {
//     try {
//       const { email } = call.request;
//       const loc = await Location.findOne({ email });

//       if (!loc) {
//         return callback(null, { status: "error", message: "Location not found" });
//       }

//       callback(null, {
//         email,
//         latitude: loc.latitude,
//         longitude: loc.longitude,
//         updatedAt: loc.updatedAt.toISOString(),
//         status: "success",
//         message: "Location fetched",
//       });
//     } catch {
//       callback({
//         code: grpc.status.INTERNAL,
//         message: "Error fetching location",
//       });
//     }
//   },

//   GetAllLocations: async (_, callback) => {
//     try {
//       const locs = await Location.find();
//       callback(null, {
//         locations: locs.map((loc) => ({
//           email: loc.email,
//           latitude: loc.latitude,
//           longitude: loc.longitude,
//           updatedAt: loc.updatedAt.toISOString(),
//           status: "success",
//           message: "Location fetched",
//         })),
//       });
//     } catch {
//       callback({
//         code: grpc.status.INTERNAL,
//         message: "Error fetching locations",
//       });
//     }
//   },
// };

// export const startGrpcServer = () => {
//   const server = new grpc.Server();
//   server.addService(locationProto.LocationService.service, locationService);

//   server.bindAsync(
//     "0.0.0.0:50055",
//     grpc.ServerCredentials.createInsecure(),
//     (err, port) => {
//       if (err) console.error(err);
//       else {
//         server.start();
//         console.log(`📍 Location gRPC server running on port ${port}`);
//       }
//     }
//   );
// };

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import Location from "../models/locationModel.js";
import { calculateDistanceKm } from "../../../matching_service/src/utils/distanceCalc.js";
import { riderClient, driverClient, matchingClient } from "../grpc/client.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/location.proto");

const pkgDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const locationProto = grpc.loadPackageDefinition(pkgDef).location;

// Generic gRPC call helper with safe error logging
async function grpcCall(client, method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, res) => {
      if (err) {
        console.error(`⚠ gRPC ${client.constructor.name}.${method} failed:`, err.message || err);
        return reject(err);
      }
      resolve(res);
    });
  });
}

// Helper to pretty-print only useful rider fields for logs
function summariseRider(r) {
  return {
    email: r?.email,
    rideStatus: r?.rideStatus,
    boardingStation: r?.boardingStation ? '[object]' : undefined,
    boardingLatitude: r?.boardingLatitude,
    boardingLongitude: r?.boardingLongitude,
    destinationStation: r?.destinationStation ? '[object]' : undefined,
    destinationLatitude: r?.destinationLatitude,
    destinationLongitude: r?.destinationLongitude,
  };
}

const locationService = {
  UpdateLocation: async (call, callback) => {
    try {
      const { email, latitude, longitude } = call.request;
      console.log(`\n🔔 UpdateLocation called for driver=${email} pos=(${latitude}, ${longitude})`);

      // 1️⃣ Update driver's location in DB
      const updated = await Location.findOneAndUpdate(
        { email },
        { latitude, longitude, updatedAt: new Date() },
        { new: true, upsert: true }
      );

      // 2️⃣ Get active match for this driver (1 rider per driver)
      let matchRes;
      try {
        matchRes = await grpcCall(matchingClient, "GetActiveMatchByDriverEmail", { email });
        console.log("📡 matchingClient.GetActiveMatchByDriverEmail ->", matchRes);
      } catch (err) {
        console.warn("❌ Could not fetch active match for driver (gRPC error). Skipping ride checks.");
        // return normal response — don't crash
        return callback(null, {
          email,
          latitude,
          longitude,
          updatedAt: updated.updatedAt.toISOString(),
          status: "success",
          message: "Location updated (matching unavailable)",
        });
      }

      if (!matchRes || matchRes.status !== "success" || !matchRes.riderEmail) {
        console.log("ℹ No active rider for this driver (matchRes empty or not success).");
        return callback(null, {
          email,
          latitude,
          longitude,
          updatedAt: updated.updatedAt.toISOString(),
          status: "success",
          message: "Location updated (no active rider)",
        });
      }

      const riderEmail = matchRes.riderEmail;
      console.log(`🔎 Active rider for driver ${email} -> ${riderEmail}`);

      // Fetch rider details
      let rider;
      try {
        rider = await grpcCall(riderClient, "GetRiderByEmail", { email: riderEmail });
        console.log("📡 riderClient.GetRiderByEmail ->", summariseRider(rider));
      } catch (err) {
        console.warn("❌ Failed to fetch rider details for", riderEmail, " — skipping logic.");
        return callback(null, {
          email,
          latitude,
          longitude,
          updatedAt: updated.updatedAt.toISOString(),
          status: "success",
          message: "Location updated (rider unavailable)",
        });
      }

      // Support flat and nested coordinate shapes
      const boardingLat = rider?.boardingStation?.latitude ?? rider?.boardingLatitude ?? null;
      const boardingLong = rider?.boardingStation?.longitude ?? rider?.boardingLongitude ?? null;
      const destLat = rider?.destinationStation?.latitude ?? rider?.destinationLatitude ?? null;
      const destLong = rider?.destinationStation?.longitude ?? rider?.destinationLongitude ?? null;

      if (boardingLat == null || boardingLong == null) {
        console.warn(`⚠ Rider ${riderEmail} missing boarding coords — skipping pickup logic.`);
      } else {
        const distToPickup = calculateDistanceKm(latitude, longitude, boardingLat, boardingLong);
        console.log(`   → distToPickup = ${distToPickup.toFixed(5)} km (threshold 0.15 km). rider.rideStatus=${rider.rideStatus}`);

        // If rider is matched and close enough, set on_trip
        if (rider.rideStatus === "matched") {
          if (distToPickup <= 0.15) {
            try {
              await grpcCall(riderClient, "UpdateRideStatus", { email: riderEmail, status: "on_trip" });
              console.log(`🟢 PICKUP: rider ${riderEmail} status updated to on_trip`);
            } catch (err) {
              console.error("❌ Failed to update rider status to on_trip:", err.message || err);
            }
          } else {
            console.log("   → Not within pickup threshold yet.");
          }
        } else {
          console.log(`   → Rider not in matched state (current: ${rider.rideStatus}).`);
        }
      }

      if (destLat == null || destLong == null) {
        console.warn(`⚠ Rider ${riderEmail} missing destination coords — skipping drop logic.`);
      } else {
        const distToDrop = calculateDistanceKm(latitude, longitude, destLat, destLong);
        console.log(`   → distToDrop = ${distToDrop.toFixed(5)} km (threshold 0.15 km). rider.rideStatus=${rider.rideStatus}`);

        // If rider is on_trip and close to destination, complete the ride
        if (rider.rideStatus === "on_trip") {
          if (distToDrop <= 0.15) {
            try {
              await grpcCall(riderClient, "UpdateRideStatus", { email: riderEmail, status: "completed" });
              console.log(`🏁 DROP: rider ${riderEmail} status updated to completed`);

              // increment seat and update match
              try {
                await grpcCall(driverClient, "IncrementDriverSeat", { email });
                console.log(`   → Incremented driver ${email} seat`);
              } catch (err) {
                console.error("❌ Failed to increment driver seat:", err.message || err);
              }

              try {
                await grpcCall(matchingClient, "UpdateMatchStatus", { email: riderEmail, status: "completed" });
                console.log(`   → Matching updated for rider ${riderEmail} -> completed`);
              } catch (err) {
                console.error("❌ Failed to update match status:", err.message || err);
              }

            } catch (err) {
              console.error("❌ Failed to set rider to completed:", err.message || err);
            }
          } else {
            console.log("   → Not within drop threshold yet.");
          }
        } else {
          console.log(`   → Rider not in on_trip state (current: ${rider.rideStatus}).`);
        }
      }

      // Final response
      return callback(null, {
        email,
        latitude,
        longitude,
        updatedAt: updated.updatedAt.toISOString(),
        status: "success",
        message: "Location updated and evaluated",
      });
    } catch (err) {
      console.error("❌ UpdateLocation failed:", err);
      return callback({
        code: grpc.status.INTERNAL,
        message: "Error updating location",
      });
    }
  },

  GetLocation: async (call, callback) => {
    try {
      const { email } = call.request;
      const loc = await Location.findOne({ email });

      if (!loc) {
        return callback(null, { status: "error", message: "Location not found" });
      }

      callback(null, {
        email,
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updatedAt.toISOString(),
        status: "success",
        message: "Location fetched",
      });
    } catch (err) {
      console.error("❌ GetLocation error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching location",
      });
    }
  },

  GetAllLocations: async (_, callback) => {
    try {
      const locs = await Location.find();
      callback(null, {
        locations: locs.map((loc) => ({
          email: loc.email,
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: loc.updatedAt.toISOString(),
          status: "success",
          message: "Location fetched",
        })),
      });
    } catch (err) {
      console.error("❌ GetAllLocations error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching locations",
      });
    }
  },
};

export const startGrpcServer = () => {
  const server = new grpc.Server();
  server.addService(locationProto.LocationService.service, locationService);

  server.bindAsync(
    "0.0.0.0:50055",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) console.error(err);
      else {
        server.start();
        console.log(`📍 Location gRPC server running on port ${port}`);
      }
    }
  );
};

