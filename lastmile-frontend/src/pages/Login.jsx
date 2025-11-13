import { useState } from "react";
import { registerUser, loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("rider");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await registerUser({ username, email, role });

        if (res.data.status === "success") {
          localStorage.setItem("email", email);
          localStorage.setItem("role", role);
          nav("/verify-otp");
        } else {
          setMsg(res.data.message);
        }
      } else {
        const res = await loginUser({ email });

        if (res.data.status === "success") {
          const userRole = res.data.role || "rider";
          localStorage.setItem("email", email);
          localStorage.setItem("role", userRole);
          nav(userRole === "driver" ? "/driver" : "/home");
        } else {
          setMsg(res.data.message);
        }
      }
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
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
          background: "#fff",
          padding: "30px 40px",
          borderRadius: "12px",
          width: "350px",
          textAlign: "center",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          {mode === "login" ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <div style={{ marginBottom: "12px", textAlign: "left" }}>
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px", textAlign: "left" }}>
                <label>Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="rider">Rider</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: "12px", textAlign: "left" }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter email"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              backgroundColor: "#007bff",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Loading..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        {/* Message */}
        {msg && (
          <p
            style={{
              marginTop: "15px",
              color: msg.includes("success") ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {msg}
          </p>
        )}

        {/* BOTTOM TOGGLE BUTTON */}
        <p style={{ marginTop: "20px", fontSize: "14px" }}>
          {mode === "login" ? (
            <>
              New here?{" "}
              <span
                onClick={() => setMode("register")}
                style={{ color: "#007bff", cursor: "pointer" }}
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                onClick={() => setMode("login")}
                style={{ color: "#007bff", cursor: "pointer" }}
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
