import nodemailer from "nodemailer";

// DEBUG LOGS — REMOVE AFTER TESTING
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "loaded" : "missing");

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // required for gmail smtp
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email to driver
export async function sendMailToDriver(driver, rider, distance) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: driver.email,
    subject: "New Rider Assigned!",
    html: `
      <h2>🚗 You have a rider!</h2>
      <p><strong>Rider:</strong> ${rider.name} (${rider.email})</p>
      <p><strong>Pickup:</strong> ${rider.boardingStationName}</p>
      <p><strong>Destination:</strong> ${rider.destinationStationName}</p>
      <p><strong>Distance:</strong> ${distance.toFixed(1)} km</p>
    `,
  });
}

// Send email to rider
export async function sendMailToRider(rider, driver, distance) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: rider.email,
    subject: "Your Driver is Assigned!",
    html: `
      <h2>✅ Driver Found!</h2>
      <p><strong>Driver:</strong> ${driver.name} (${driver.email})</p>
      <p><strong>Car Number:</strong> ${driver.carNumber}</p>
      <p><strong>Available Seats:</strong> ${driver.availableSeats}</p>
      <p><strong>Distance:</strong> ${distance.toFixed(1)} km away</p>
      <p><strong>Route:</strong> ${driver.route.map(r => r.place).join(", ")}</p>
    `,
  });
}
