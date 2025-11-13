import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RiderDashboard() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [boarding, setBoarding] = useState("");
  const [destination, setDestination] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // -------------------------------------------------------
  // Fetch Stations
  // -------------------------------------------------------
  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await axios.get("http://localhost:5002/api/stations/all");

        let list = [];

        if (Array.isArray(res.data)) {
          list = res.data.flatMap((station) => {
            const main = {
              name: station.name,
              latitude: station.latitude,
              longitude: station.longitude,
            };

            const nearby =
              station.nearbyLocations?.map((loc) => ({
                name: loc.name,
                latitude: loc.latitude,
                longitude: loc.longitude,
              })) || [];

            return [main, ...nearby];
          });
        }

        setLocations(list);
      } catch (err) {
        console.error(err.message);
        setMessage("⚠️ Failed to fetch locations.");
      } finally {
        setLoading(false);
      }
    }

    fetchStations();
  }, []);

  // -------------------------------------------------------
  // Register Rider (Matching runs automatically in backend)
  // -------------------------------------------------------
  const handleSubmit = async () => {
    if (!email || !boarding || !destination || !arrivalTime) {
      alert("Please fill all fields!");
      return;
    }

    localStorage.setItem("email", email);
    setMessage("📝 Registering rider...");

    try {
      const res = await axios.post(
        "http://localhost:4003/api/rider/register_rider",
        {
          email,
          boardingStationName: boarding,
          destinationStationName: destination,
          arrivalTime,
        }
      );

      const rider = res.data.rider;

      if (!rider) {
        setMessage(res.data.message || "❌ Failed to register rider.");
        return;
      }

      // ⭐ Matching is already done in backend
      if (rider.rideStatus !== "matched") {
        setMessage("⏳ Waiting for driver assignment...");
        return;
      }

      setMessage("🎉 Driver assigned! Redirecting...");

      // Redirect to tracking page
      navigate("/tracking", {
        state: {
          riderEmail: email,
          boarding: {
            lat: rider.boardingStation.latitude,
            lng: rider.boardingStation.longitude,
          },
          driverEmail: rider.assignedDriver,
        },
      });
    } catch (err) {
      console.error(err.message);
      setMessage("❌ Error during registration.");
    }
  };

  // -------------------------------------------------------
  // UI Rendering
  // -------------------------------------------------------
  if (loading) return <p>Loading locations...</p>;
  if (locations.length === 0) return <p>No stations found.</p>;

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "500px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        border: "1px solid #ddd",
        borderRadius: "10px",
        backgroundColor: "#fafafa",
      }}
    >
      <h2>🚖 Rider Dashboard</h2>

      {/* Email */}
      <div style={{ marginTop: "20px" }}>
        <label>📧 Rider Email:</label>
        <br />
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "5px",
          }}
        />
      </div>

      <hr />

      {/* Boarding */}
      <div style={{ marginTop: "20px" }}>
        <label>🛤️ Boarding Location:</label>
        <br />
        <select
          value={boarding}
          onChange={(e) => setBoarding(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">Select boarding point</option>
          {locations.map((loc, index) => (
            <option key={index} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Destination */}
      <div style={{ marginTop: "20px" }}>
        <label>🎯 Destination Location:</label>
        <br />
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">Select destination</option>
          {locations.map((loc, index) => (
            <option key={index} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Arrival Time */}
      <div style={{ marginTop: "20px" }}>
        <label>🕒 Time of Arrival:</label>
        <br />
        <input
          type="time"
          value={arrivalTime}
          onChange={(e) => setArrivalTime(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{
          marginTop: "25px",
          padding: "10px 20px",
          width: "100%",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Register & Start Tracking
      </button>

      {/* Message */}
      {message && (
        <p
          style={{
            marginTop: "20px",
            color: message.includes("🎉") ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
