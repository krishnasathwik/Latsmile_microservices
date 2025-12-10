// import grpc from "@grpc/grpc-js";
// import protoLoader from "@grpc/proto-loader";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// function loadProto(protoName) {
//   const PROTO_PATH = path.resolve(__dirname, `../../../protos/${protoName}.proto`);
//   const pkgDef = protoLoader.loadSync(PROTO_PATH);
//   return grpc.loadPackageDefinition(pkgDef);
// }

// const userProto = loadProto("user").user;
// const riderProto = loadProto("rider").rider;
// const driverProto = loadProto("driver").driver;
// const locationProto = loadProto("location").location;

// export const authClient = new userProto.UserService(
//   "localhost:50051",
//   grpc.credentials.createInsecure()
// );

// export const riderClient = new riderProto.RiderService(
//   "localhost:50054",
//   grpc.credentials.createInsecure()
// );

// export const driverClient = new driverProto.DriverService(
//   "localhost:50053",
//   grpc.credentials.createInsecure()
// );

// export const locationClient = new locationProto.LocationService(
//   "localhost:50055",
//   grpc.credentials.createInsecure()
// );

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadProto(protoName) {
  const PROTO_PATH = path.resolve(__dirname, `../../../protos/${protoName}.proto`);
  const pkgDef = protoLoader.loadSync(PROTO_PATH);
  return grpc.loadPackageDefinition(pkgDef);
}

const riderProto = loadProto("rider").rider;
const driverProto = loadProto("driver").driver;
const matchingProto = loadProto("matching").matching;
const locationProto = loadProto("location").location;

export const riderClient = new riderProto.RiderService(
  "localhost:50054",
  grpc.credentials.createInsecure()
);

export const driverClient = new driverProto.DriverService(
  "localhost:50053",
  grpc.credentials.createInsecure()
);

export const matchingClient = new matchingProto.MatchingService(
  "localhost:50056",
  grpc.credentials.createInsecure()
);

export const locationClient = new locationProto.LocationService(
  "localhost:50055",
  grpc.credentials.createInsecure()
);
