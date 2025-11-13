import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/station.proto");

// Load proto file
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const stationProto = grpc.loadPackageDefinition(packageDef).station;

// Create a gRPC client to connect to the Station Service
export const stationClient = new stationProto.StationService(
  "localhost:50052",
  grpc.credentials.createInsecure()
);
