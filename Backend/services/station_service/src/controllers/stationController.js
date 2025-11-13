import Station from "../models/stationModel.js";

export const addStation = async (req, res) => {
  try {
    const { name, latitude, longitude, nearbyLocations } = req.body;

    // Validate input
    if (!name || !latitude || !longitude) {
      return res.status(400).json({ message: "Name, latitude, and longitude are required" });
    }

    // Check for duplicates
    const existing = await Station.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Station already exists" });
    }

    // Create new station
    const station = await Station.create({ name, latitude, longitude, nearbyLocations });
    res.status(201).json({
      message: " Station added successfully",
      station,
    });
  } catch (err) {
    console.error(" Error adding station:", err.message);
    res.status(500).json({ message: "Server error while adding station" });
  }
};

/**
 * @desc Get all metro stations
 * @route GET /api/stations/all
 */
export const getStations = async (req, res) => {
  try {
    const stations = await Station.find();

    if (!stations.length) {
      return res.status(404).json({ message: "No stations found" });
    }

    res.status(200).json(stations);
  } catch (err) {
    console.error(" Error fetching stations:", err.message);
    res.status(500).json({ message: "Server error while fetching stations" });
  }
};

/**
 * @desc Get nearby locations for one metro station
 * @route GET /api/stations/nearby/:stationName
 */
export const getNearby = async (req, res) => {
  try {
    const { stationName } = req.params;

    if (!stationName) {
      return res.status(400).json({ message: "Station name is required" });
    }

    const station = await Station.findOne({ name: stationName });

    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    res.status(200).json({
      station: station.name,
      nearbyLocations: station.nearbyLocations,
    });
  } catch (err) {
    console.error(" Error fetching nearby locations:", err.message);
    res.status(500).json({ message: "Server error while fetching nearby locations" });
  }
};
