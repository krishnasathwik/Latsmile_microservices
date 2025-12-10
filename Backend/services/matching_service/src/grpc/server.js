// import grpc from "@grpc/grpc-js";
// import protoLoader from "@grpc/proto-loader";
// import path from "path";
// import { fileURLToPath } from "url";
// import { updateMatchStatusLogic,matchRiderLogic, getMatchByEmailLogic } from "../controllers/matchingController.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const PROTO_PATH = path.resolve(__dirname, "../../../protos/matching.proto");

// const pkgDef = protoLoader.loadSync(PROTO_PATH);
// const matchingProto = grpc.loadPackageDefinition(pkgDef).matching;

// export const startMatchingGrpc = () => {
//   const server = new grpc.Server();

//   server.addService(matchingProto.MatchingService.service, {
//     MatchRider: matchRiderLogic,
//     GetMatchByEmail: getMatchByEmailLogic,
//     UpdateMatchStatus: updateMatchStatusLogic

//   });

//   server.bindAsync(
//     "0.0.0.0:50056",
//     grpc.ServerCredentials.createInsecure(),
//     (err, port) => {
//       if (err) return console.error(err);
//       server.start();
//       console.log(`🔗 Matching gRPC server started on port ${port}`);
//     }
//   );
// };

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import {
  updateMatchStatusLogic,
  matchRiderLogic,
  getMatchByEmailLogic,
  getActiveMatchByDriverLogic,
} from "../controllers/matchingController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/matching.proto");

const pkgDef = protoLoader.loadSync(PROTO_PATH);
const matchingProto = grpc.loadPackageDefinition(pkgDef).matching;

export const startMatchingGrpc = () => {
  const server = new grpc.Server();

  server.addService(matchingProto.MatchingService.service, {
    MatchRider: matchRiderLogic,
    GetMatchByEmail: getMatchByEmailLogic,
    UpdateMatchStatus: updateMatchStatusLogic,
    GetActiveMatchByDriverEmail: getActiveMatchByDriverLogic, // ⭐ NEW
  });

  server.bindAsync(
    "0.0.0.0:50056",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) return console.error(err);
      server.start();
      console.log(`🔗 Matching gRPC server started on port ${port}`);
    }
  );
};
