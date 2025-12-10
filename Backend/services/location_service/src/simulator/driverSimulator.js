import cron from "node-cron";
import axios from "axios";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";

// ✅ Load driver proto
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/driver.proto");


const pkgDef = protoLoader.loadSync(PROTO_PATH);
const driverProto = grpc.loadPackageDefinition(pkgDef).driver;

const driverClient = new driverProto.DriverService(
  "localhost:50053",
  grpc.credentials.createInsecure()
);

// ✅ Store all simulated drivers in memory
let drivers = {}; // { email: {routeIndex, latitude, longitude, route[] } }

const BASE = "http://localhost:4004/api/location";

// Movement step (approx 25 meters)
const STEP = 0.0025;

function moveTowards(current, target) {
  const dx = target.latitude - current.latitude;
  const dy = target.longitude - current.longitude;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < STEP) {
    return { latitude: target.latitude, longitude: target.longitude, reached: true };
  }

  return {
    latitude: current.latitude + (dx / distance) * STEP,
    longitude: current.longitude + (dy / distance) * STEP,
    reached: false,
  };
}

// ✅ Fetch all drivers from DriverService
function loadDrivers() {
  driverClient.GetAllDrivers({}, (err, res) => {
    if (err) return console.error("Failed to load drivers:", err);

    res.drivers.forEach((driver) => {
      // If not already added, initialize driver
      if (!drivers[driver.email]) {
        drivers[driver.email] = {
          email: driver.email,
          route: driver.route, // array of places in DB
          routeIndex: 0,
          latitude: driver.route[0].latitude,
          longitude: driver.route[0].longitude,
        };
      }
    });

    console.log("✅ Driver routes loaded.");
  });
}

// ✅ Call once when program starts
loadDrivers();

// ✅ CRON JOB — move all drivers every 5 seconds
cron.schedule("*/5 * * * * *", async () => {
  console.log("🚗 Updating all driver positions...");

  for (let email in drivers) {
    const d = drivers[email];
    const target = d.route[d.routeIndex];

    const newPos = moveTowards(d, target);

    d.latitude = newPos.latitude;
    d.longitude = newPos.longitude;

    if (newPos.reached) {
      d.routeIndex = (d.routeIndex + 1) % d.route.length;
      console.log(`✅ ${email} reached waypoint → moving to next`);
    }

    // Update location in DB
    try {
      await axios.post(`${BASE}/update_location`, {
        email,
        latitude: d.latitude,
        longitude: d.longitude,
      });

      console.log(
        `✅ Updated ${email}: (${d.latitude.toFixed(5)}, ${d.longitude.toFixed(5)})`
      );

    } catch (err) {
      console.error(`❌ Failed updating ${email}:`, err.message);
    }
  }
});
