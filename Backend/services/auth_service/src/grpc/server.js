import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import { sendOtpEmail } from "../utils/emailHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, "../../../protos/user.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(packageDef).user;

// Utility to generate OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ✅ All RPC implementations
const userService = {
  // ------------------ REGISTER USER ------------------
  RegisterUser: async (call, callback) => {
    try {
      const { username, email, role } = call.request;

      let user = await User.findOne({ email });
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      if (user) {
        if (user.isVerified) {
          return callback(null, {
            status: "error",
            message: "User already verified. Please login.",
          });
        }
        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
      } else {
        user = new User({ username, email, role, otp, otpExpiresAt });
      }

      await user.save();
      await sendOtpEmail(email, otp);

      callback(null, {
        status: "success",
        message: "OTP sent to your email for verification.",
      });
    } catch (err) {
      console.error("RegisterUser error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      });
    }
  },

  // ------------------ VERIFY OTP ------------------
  VerifyOtp: async (call, callback) => {
    try {
      const { email, otp } = call.request;
      const user = await User.findOne({ email });

      if (!user)
        return callback(null, { status: "error", message: "User not found." });

      if (user.otp !== otp)
        return callback(null, { status: "error", message: "Invalid OTP." });

      if (user.otpExpiresAt < Date.now())
        return callback(null, { status: "error", message: "OTP expired." });

      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      callback(null, {
        status: "success",
        message: "User verified successfully.",
        username: user.username,
        role: user.role,
      });
    } catch (err) {
      console.error("VerifyOtp error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      });
    }
  },

  // ------------------ LOGIN USER ------------------
  LoginUser: async (call, callback) => {
    try {
      const { email } = call.request;
      const user = await User.findOne({ email });

      if (!user)
        return callback(null, {
          status: "error",
          message: "User not found. Please register.",
        });

      if (!user.isVerified)
        return callback(null, {
          status: "error",
          message: "User not verified. Please verify OTP.",
        });

      callback(null, {
        status: "success",
        message: "Login successful.",
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      console.error("LoginUser error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      });
    }
  },

  // ✅ ------------------ GET USER BY EMAIL ------------------
  GetUserByEmail: async (call, callback) => {
    try {
      const { email } = call.request;
      const user = await User.findOne({ email });

      if (!user) {
        return callback(null, {
          status: "error",
          message: "User not found",
        });
      }

      if (!user.isVerified) {
        return callback(null, {
          status: "error",
          message: "User not verified. Please verify OTP first.",
        });
      }

      callback(null, {
        status: "success",
        message: "User fetched successfully.",
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      console.error("GetUserByEmail error:", err);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error fetching user: " + err.message,
      });
    }
  },
};

// ------------------ START SERVER ------------------
const server = new grpc.Server();
server.addService(userProto.UserService.service, userService);

server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () =>
  console.log("🔌 Auth gRPC server running on port 50051")
);
