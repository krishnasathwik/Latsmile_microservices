import axios from "axios";

const auth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL,
  timeout: 10000,
});

export const registerUser = (payload) => auth.post("/signin", payload);
export const loginUser = (payload) => auth.post("/login", payload);
export const verifyOtp = (payload) => auth.post("/verify-otp", payload);
