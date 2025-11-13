import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to load proto
const loadProto = (protoPath) => {
  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return grpc.loadPackageDefinition(packageDef);
};

// --- Load all protos ---
const USER_PROTO     = path.resolve(__dirname, "../../../protos/user.proto");
const STATION_PROTO  = path.resolve(__dirname, "../../../protos/station.proto");
const MATCH_PROTO    = path.resolve(__dirname, "../../../protos/matching.proto");

// --- Load packages ---
const userPackage     = loadProto(USER_PROTO).user;
const stationPackage  = loadProto(STATION_PROTO).station;
const matchingPackage = loadProto(MATCH_PROTO).matching;

// --- Create gRPC clients ---
export const authClient = new userPackage.UserService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

export const stationClient = new stationPackage.StationService(
  "localhost:50052",
  grpc.credentials.createInsecure()
);

export const matchingClient = new matchingPackage.MatchingService(
  "localhost:50056",   // matching gRPC server port
  grpc.credentials.createInsecure()
);

console.log("✅ Auth, Station & Matching gRPC clients initialized");
