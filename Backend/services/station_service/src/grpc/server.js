import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import Station from "../models/stationModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/station.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const stationProto = grpc.loadPackageDefinition(packageDef).station;

/* -------- Implement gRPC Methods -------- */
const stationService = {
  AddStation: async (call, callback) => {
    try {
      const { name, latitude, longitude, nearbyLocations } = call.request;

      const existing = await Station.findOne({ name });
      if (existing) {
        return callback(null, {
          status: "FAILED",
          message: "Station already exists",
        });
      }

      await Station.create({ name, latitude, longitude, nearbyLocations });

      callback(null, { status: "SUCCESS", message: "Station added successfully" });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: "Error adding station: " + err.message,
      });
    }
  },

  GetStations: async (_, callback) => {
    try {
      const stations = await Station.find();
      callback(null, { stations });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching stations: " + err.message,
      });
    }
  },

  GetNearbyLocations: async (call, callback) => {
    try {
      const { name } = call.request;
      const station = await Station.findOne({ name });

      if (!station) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Station not found",
        });
      }

      callback(null, { locations: station.nearbyLocations });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching nearby locations: " + err.message,
      });
    }
  },

  // 👇 NEW FUNCTION FOR DRIVER SERVICE
  GetLocationByName: async (call, callback) => {
    try {
      const { name } = call.request;

      // Search for main station
      const station = await Station.findOne({ name });
      if (station) {
        return callback(null, {
          name: station.name,
          latitude: station.latitude,
          longitude: station.longitude,
          status: "SUCCESS",
          message: "Station found",
        });
      }

      // If not found, look for nearby location
      const nearbyStation = await Station.findOne({ "nearbyLocations.name": name });
      if (nearbyStation) {
        const loc = nearbyStation.nearbyLocations.find((n) => n.name === name);
        return callback(null, {
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          status: "SUCCESS",
          message: "Nearby location found",
        });
      }

      // Not found anywhere
      callback({
        code: grpc.status.NOT_FOUND,
        message: "No station or nearby location found",
      });
    } catch (err) {
      console.error("GetLocationByName error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching location by name: " + err.message,
      });
    }
  },
};

/* -------- Start gRPC Server -------- */
export const startGrpcServer = () => {
  const server = new grpc.Server();
  server.addService(stationProto.StationService.service, stationService);

  const address = "0.0.0.0:50052";
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error(" Failed to start gRPC server:", err);
      return;
    }
    server.start();
    console.log(`🚉 Station gRPC server running on port ${port}`);
  });
};
