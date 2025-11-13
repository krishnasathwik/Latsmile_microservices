import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import Location from "../models/locationModel.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/location.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const locationProto = grpc.loadPackageDefinition(packageDef).location;

const locationService = {
  UpdateLocation: async (call, callback) => {
    try {
      const { email, latitude, longitude } = call.request;

      const updated = await Location.findOneAndUpdate(
        { email },
        { latitude, longitude, updatedAt: new Date() },
        { new: true, upsert: true }
      );

      callback(null, {
        email,
        latitude,
        longitude,
        updatedAt: updated.updatedAt.toISOString(),
        status: "success",
        message: "Location updated"
      });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: "Error updating location"
      });
    }
  },

  GetLocation: async (call, callback) => {
    try {
      const { email } = call.request;
      const loc = await Location.findOne({ email });

      if (!loc) return callback(null, {
        status: "error",
        message: "Location not found"
      });

      callback(null, {
        email,
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updatedAt.toISOString(),
        status: "success",
        message: "Location fetched"
      });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching location"
      });
    }
  },

  GetAllLocations: async (_, callback) => {
    try {
      const locs = await Location.find();

      const formatted = locs.map(loc => ({
        email: loc.email,
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updatedAt.toISOString(),
        status: "success",
        message: "Location fetched"
      }));

      callback(null, { locations: formatted });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching locations"
      });
    }
  }
};

export const startGrpcServer = () => {
  const server = new grpc.Server();
  server.addService(locationProto.LocationService.service, locationService);

  server.bindAsync("0.0.0.0:50055", grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) console.error(err);
    else {
      server.start();
      console.log(`📍 Location gRPC server running on port ${port}`);
    }
  });
};
