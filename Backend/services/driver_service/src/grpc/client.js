import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadProto(protoName) {
  const PROTO_PATH = path.resolve(__dirname, `../../../protos/${protoName}.proto`);
  const packageDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(packageDef);
}

// Load both protos
const userProto = loadProto("user").user;
const stationProto = loadProto("station").station;

// Auth Service Client
export const authClient = new userProto.UserService(
  "localhost:50051", // auth_service gRPC port
  grpc.credentials.createInsecure()
);

// Station Service Client
export const stationClient = new stationProto.StationService(
  "localhost:50052", // station_service gRPC port
  grpc.credentials.createInsecure()
);

console.log("✅ gRPC clients for Auth & Station loaded successfully");
