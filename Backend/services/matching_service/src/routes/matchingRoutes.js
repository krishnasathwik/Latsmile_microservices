import express from "express";
import { matchRiderHttp, getMatchHttp ,updateMatchStatusHttp} from "../controllers/matchingHttpController.js";

const router = express.Router();

router.post("/match", matchRiderHttp);
router.post("/get-match", getMatchHttp);
router.post("/update-match-status", updateMatchStatusHttp);

export default router;
