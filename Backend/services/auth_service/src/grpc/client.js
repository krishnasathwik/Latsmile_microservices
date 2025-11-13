import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const PROTO_PATH = path.resolve(__dirname, "../../../protos/user.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH);
const userProto = grpc.loadPackageDefinition(packageDef).user;

export const userClient = new userProto.UserService(
  "localhost:50051", // gRPC server URL
  grpc.credentials.createInsecure()
);
