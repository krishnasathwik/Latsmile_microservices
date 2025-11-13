import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/location.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH);
const locationProto = grpc.loadPackageDefinition(packageDef).location;

export const locationClient = new locationProto.LocationService(
  "localhost:50055",
  grpc.credentials.createInsecure()
);
