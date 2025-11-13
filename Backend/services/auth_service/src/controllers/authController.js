import { userClient } from "../grpc/client.js";

// Register user (sign-up)
export const registerUser = (req, res) => {
  const { username, email, role } = req.body;

  userClient.RegisterUser({ username, email, role }, (err, response) => {
    if (err) {
      console.error("gRPC error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(response);
  });
};

// Verify OTP
export const verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  userClient.VerifyOtp({ email, otp }, (err, response) => {
    if (err) {
      console.error("gRPC error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(response);
  });
};


// Login user (check existence)
export const loginUser = (req, res) => {
  const { email } = req.body;

  userClient.LoginUser({ email }, (err, response) => {
    if (err) {
      console.error("gRPC error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(response);
  });
};
