import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { useLocation } from "react-router-dom";

// Custom car icon
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [40, 40],
});

// Custom rider icon
const riderIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
  iconSize: [35, 35],
});

export default function TrackingPage() {
  const { state } = useLocation();
  const riderEmail = state?.riderEmail;
  const boarding = state?.boarding;

  const [driverPos, setDriverPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [statusText, setStatusText] = useState("Waiting for driver location...");

  useEffect(() => {
    if (!riderEmail) return;

    // Poll every 4 seconds
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `http://localhost:4003/api/rider/distance?riderEmail=${riderEmail}`
        );

        if (res.data.status === "success") {
          setDriverPos({
            lat: res.data.driverLat,
            lng: res.data.driverLong,
          });

          setDistance(res.data.distanceKm.toFixed(2));
          setStatusText("Driver is on the way 🚗");
        } else {
          setStatusText(res.data.message || "Waiting for driver...");
        }
      } catch (err) {
        console.log("Poll error:", err.message);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [riderEmail]);

  if (!boarding) return <h2>❌ No rider data found.</h2>;

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <h2 style={{ textAlign: "center" }}>Live Driver Tracking</h2>
      <p style={{ textAlign: "center", fontSize: "18px" }}>{statusText}</p>

      {distance && (
        <p style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold" }}>
          📏 Distance: {distance} km
        </p>
      )}

      <MapContainer
        center={[boarding.lat, boarding.lng]}
        zoom={14}
        style={{ height: "85%", width: "100%" }}
      >
        {/* Free tile layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />

        {/* Rider Marker */}
        <Marker position={[boarding.lat, boarding.lng]} icon={riderIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Driver Marker */}
        {driverPos && (
          <Marker position={[driverPos.lat, driverPos.lng]} icon={carIcon}>
            <Popup>Driver</Popup>
          </Marker>
        )}

        {/* Line: Driver -> Rider */}
        {driverPos && (
          <Polyline
            positions={[
              [boarding.lat, boarding.lng],
              [driverPos.lat, driverPos.lng],
            ]}
            color="blue"
          />
        )}
      </MapContainer>
    </div>
  );
}
