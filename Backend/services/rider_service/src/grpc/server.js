// rider_service/src/grpc/server.js

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import Rider from "../models/riderModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/rider.proto");

// Load proto definition
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const riderProto = grpc.loadPackageDefinition(packageDef).rider;

// ----------------- gRPC Methods -----------------

const riderService = {
  GetRiderByEmail: async (call, callback) => {
    try {
      const { email } = call.request;

      const rider = await Rider.findOne({ email });

      if (!rider) {
        return callback(null, {
          status: "error",
          message: "Rider not found",
        });
      }

      callback(null, {
        status: "success",
        message: "Rider fetched",

        name: rider.name,
        email: rider.email,

        // Boarding station details
        boardingStationName: rider.boardingStation.name,
        boardingLatitude: rider.boardingStation.latitude,
        boardingLongitude: rider.boardingStation.longitude,

        // Destination station details
        destinationStationName: rider.destinationStation.name,
        destinationLatitude: rider.destinationStation.latitude,
        destinationLongitude: rider.destinationStation.longitude,

        arrivalTime: rider.arrivalTime,
        rideStatus: rider.rideStatus,
      });
    } catch (err) {
      console.error("GetRiderByEmail error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Server error retrieving rider",
      });
    }
  },

  UpdateRideStatus: async (call, callback) => {
    try {
      const { email, status } = call.request;

      const rider = await Rider.findOneAndUpdate(
        { email },
        { rideStatus: status },
        { new: true }
      );

      if (!rider) {
        return callback(null, {
          status: "error",
          message: "Rider not found",
        });
      }

      callback(null, {
        status: "success",
        message: `Ride status updated to ${status}`,
      });
    } catch (err) {
      console.error("UpdateRideStatus error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error updating ride status",
      });
    }
  },
};

// ----------------- Start Server -----------------

export const startGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(riderProto.RiderService.service, riderService);

  const address = "0.0.0.0:50054";

  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error("Failed to start rider gRPC server:", err);
      return;
    }
    server.start();
    console.log(`🚖 Rider gRPC server running on port ${port}`);
  });
};
