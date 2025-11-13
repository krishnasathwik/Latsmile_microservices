import { useState, useRef } from "react";
import { verifyOtp } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);
  const nav = useNavigate();
  const email = localStorage.getItem("email");

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return; // Only numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next box if value entered
    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) {
      alert("Enter a valid 6-digit OTP");
      return;
    }

    try {
      const res = await verifyOtp({ email, otp: finalOtp });
      localStorage.setItem("role", res.data.role);
      nav("/home");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#eef1f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          padding: "30px 40px",
          background: "#fff",
          width: "380px",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Verify OTP</h2>
        <p style={{ marginBottom: "20px", color: "#333" }}>
          Enter the 6-digit OTP sent to <b>{email}</b>
        </p>

        {/* OTP Boxes */}
        <form onSubmit={handleVerify}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            {otp.map((val, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                value={val}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => (inputsRef.current[i] = el)}
                style={{
                  width: "45px",
                  height: "50px",
                  textAlign: "center",
                  fontSize: "22px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#007bff",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
}
