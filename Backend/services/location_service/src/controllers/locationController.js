import { locationClient } from "../grpc/client.js";

export const updateLocation = (req, res) => {
  const { email, latitude, longitude } = req.body;

  locationClient.UpdateLocation(
    { email, latitude, longitude },
    (err, response) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(response);
    }
  );
};

export const getLocation = (req, res) => {
  const { email } = req.params;

  locationClient.GetLocation({ email }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
};

export const getAllLocations = (req, res) => {
  locationClient.GetAllLocations({}, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
};
