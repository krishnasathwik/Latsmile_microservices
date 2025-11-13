import { useEffect, useState } from "react";
import axios from "axios";

export default function DriverDashboard() {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [carNumber, setCarNumber] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [availableSeats, setAvailableSeats] = useState("");
  const [routes, setRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [message, setMessage] = useState("");

  // ✅ Fetch and flatten routes from backend (stations + nearbyLocations)
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await axios.get("http://localhost:5002/api/stations/all", {
          params: { email },
        });

        let allRoutes = [];

        if (Array.isArray(res.data)) {
          allRoutes = res.data.flatMap((station) => {
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
        } else if (res.data?.stations) {
          allRoutes = res.data.stations.flatMap((station) => {
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

        setRoutes(allRoutes);
      } catch (err) {
        console.error("Error fetching routes:", err.message);
        setMessage("⚠️ Failed to fetch available routes.");
      }
    }

    if (role === "driver") fetchRoutes();
  }, [role, email]);

  // ✅ Handle route checkbox selection
  const handleRouteChange = (routeName) => {
    setSelectedRoutes((prev) =>
      prev.includes(routeName)
        ? prev.filter((r) => r !== routeName)
        : [...prev, routeName]
    );
  };

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !email ||
      !carNumber ||
      !totalSeats ||
      !availableSeats ||
      selectedRoutes.length === 0
    ) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5003/api/driver/register_driver", {
        email,
        carNumber,
        totalSeats: Number(totalSeats),
        availableSeats: Number(availableSeats),
        routeNames: selectedRoutes,
      });

      if (res.data.status === "success") {
        setMessage("✅ Driver registered successfully!");
      } else {
        setMessage(res.data.message || "Failed to register driver.");
      }
    } catch (err) {
      console.error("Error registering driver:", err.message);
      setMessage("❌ Error registering driver. Please try again later.");
    }
  };

  // ✅ If not a driver, restrict access
  if (role !== "driver") {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          fontFamily: "Arial",
        }}
      >
        <h2>⛔ Access Denied</h2>
        <p>This dashboard is only available for registered drivers.</p>
      </div>
    );
  }

  // ✅ UI for driver form
  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#f9f9f9",
        borderRadius: "10px",
        border: "1px solid #ddd",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>🚗 Driver Dashboard</h2>
      <p>Welcome, <b>{email}</b></p>
      <hr />

      <form onSubmit={handleSubmit}>
        {/* Car Number */}
        <div style={{ marginTop: "20px" }}>
          <label>🚘 Car Number:</label>
          <br />
          <input
            type="text"
            value={carNumber}
            onChange={(e) => setCarNumber(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="KA-01-AB-1234"
          />
        </div>

        {/* Total Seats */}
        <div style={{ marginTop: "20px" }}>
          <label>💺 Total Seats:</label>
          <br />
          <input
            type="number"
            min="1"
            value={totalSeats}
            onChange={(e) => setTotalSeats(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="Enter total seats"
          />
        </div>

        {/* Available Seats */}
        <div style={{ marginTop: "20px" }}>
          <label>🪑 Available Seats:</label>
          <br />
          <input
            type="number"
            min="0"
            value={availableSeats}
            onChange={(e) => setAvailableSeats(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="Enter available seats"
          />
        </div>

        {/* Routes */}
        <div style={{ marginTop: "25px" }}>
          <label>🗺️ Select Your Routes:</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginTop: "10px",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "#fff",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          >
            {routes.length > 0 ? (
              routes.map((r, index) => (
                <label key={index} style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    value={r.name}
                    checked={selectedRoutes.includes(r.name)}
                    onChange={() => handleRouteChange(r.name)}
                  />{" "}
                  {r.name}
                </label>
              ))
            ) : (
              <p>No routes available</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
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
          Register / Update Details
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "20px",
            color: message.includes("✅") ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
