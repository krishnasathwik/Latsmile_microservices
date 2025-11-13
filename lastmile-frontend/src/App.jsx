import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import RiderDashboard from "./pages/RiderDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import TrackingPage from "./pages/TrackingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/home" element={<RiderDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/tracking" element={<TrackingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
