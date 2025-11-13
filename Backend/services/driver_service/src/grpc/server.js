import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import Driver from "../models/driverModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/driver.proto");

// Load proto
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const driverProto = grpc.loadPackageDefinition(packageDef).driver;

/* ------------------ gRPC Methods ------------------ */

const driverService = {

  // ✅ Fetch full driver details by email
  GetDriverByEmail: async (call, callback) => {
    try {
      const { email } = call.request;

      const driver = await Driver.findOne({ email });

      if (!driver) {
        return callback(null, { status: "error", message: "Driver not found" });
      }

      callback(null, {
        status: "success",
        message: "Driver fetched",
        name: driver.name,
        email: driver.email,
        carNumber: driver.carNumber,
        totalSeats: driver.totalSeats,
        availableSeats: driver.availableSeats,
        statusText: driver.status,
        route: driver.route.map((r) => ({
          place: r.place,
          latitude: r.latitude,
          longitude: r.longitude,
        })),
      });

    } catch (err) {
      console.error("GetDriverByEmail error:", err);
      callback({ code: grpc.status.INTERNAL, message: "Server error" });
    }
  },

  // ✅ Update driver location (called by location service)
  UpdateDriverLocation: async (call, callback) => {
    try {
      const { email, latitude, longitude } = call.request;

      const driver = await Driver.findOneAndUpdate(
        { email },
        { currentLocation: { latitude, longitude, updatedAt: new Date() } },
        { new: true }
      );

      if (!driver) {
        return callback(null, { status: "error", message: "Driver not found" });
      }

      callback(null, {
        status: "success",
        message: "Driver location updated",
      });

    } catch (err) {
      console.error("UpdateDriverLocation error:", err);
      callback({ code: grpc.status.INTERNAL, message: "Server error updating driver" });
    }
  },

  // ✅ Fetch all drivers
  GetAllDrivers: async (call, callback) => {
    try {
      const drivers = await Driver.find({});

      const formattedDrivers = drivers.map((driver) => ({
        status: "success",
        message: "Driver fetched",
        name: driver.name,
        email: driver.email,
        carNumber: driver.carNumber,
        totalSeats: driver.totalSeats,
        availableSeats: driver.availableSeats,
        statusText: driver.status,
        route: driver.route.map((r) => ({
          place: r.place,
          latitude: r.latitude,
          longitude: r.longitude,
        })),
      }));

      callback(null, { drivers: formattedDrivers });

    } catch (err) {
      console.error("GetAllDrivers error:", err);
      callback({ code: grpc.status.INTERNAL, message: "Failed to fetch drivers" });
    }
  },
};

/* ------------------ Start gRPC Server ------------------ */

export const startGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(driverProto.DriverService.service, driverService);

  const address = "0.0.0.0:50053";

  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error("❌ Failed to start Driver gRPC server:", err);
      return;
    }
    server.start();
    console.log(`🚗 Driver gRPC server running on port ${port}`);
  });
};
