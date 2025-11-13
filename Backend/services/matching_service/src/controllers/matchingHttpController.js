import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/matching.proto");

const pkgDef = protoLoader.loadSync(PROTO_PATH);
const matchingProto = grpc.loadPackageDefinition(pkgDef).matching;

const client = new matchingProto.MatchingService(
  "localhost:50056",
  grpc.credentials.createInsecure()
);

export const matchRiderHttp = (req, res) => {
  const { email } = req.body;

  client.MatchRider({ email }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
};

export const getMatchHttp = (req, res) => {
  const { email } = req.body;

  client.getMatchByEmail({ email }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
};

export const updateMatchStatusHttp = (req, res) => {
  const { riderEmail, status } = req.body;

  client.UpdateMatchStatus({ riderEmail, status }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
};
