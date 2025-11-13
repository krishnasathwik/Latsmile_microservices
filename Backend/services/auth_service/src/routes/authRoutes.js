import express from "express";
import { registerUser, loginUser,verifyOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/signin", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);

export default router;
