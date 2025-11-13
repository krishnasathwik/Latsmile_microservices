import dotenv from "dotenv";
import User from "../../services/auth_service/src/models/userModel.js";

dotenv.config();

/* ======================================================
   ✅ Helper function to safely extract email
====================================================== */
function extractEmail(req) {
  // Works for POST, GET, and route params
  return req.body?.email || req.query?.email || req.params?.email;
}

/* ======================================================
   ✅ Verify Driver Role Middleware
====================================================== */
export const isDriver = async (req, res, next) => {
  try {
    const email = extractEmail(req);

    if (!email) {
      return res.status(400).json({ message: "Email required to verify role" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "driver") {
      return res.status(403).json({ message: "Access denied: not a driver" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("isDriver error:", err);
    res.status(500).json({ message: "Server error checking driver role" });
  }
};

/* ======================================================
   ✅ Verify Rider Role Middleware
====================================================== */
export const isRider = async (req, res, next) => {
  try {
    const email = extractEmail(req);

    if (!email) {
      return res.status(400).json({ message: "Email required to verify role" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "rider") {
      return res.status(403).json({ message: "Access denied: not a rider" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("isRider error:", err);
    res.status(500).json({ message: "Server error checking rider role" });
  }
};
