// src/utils/emailHelper.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"LastMile Service" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP for LastMile Verification",
    html: `
      <div style="font-family:Arial,sans-serif; padding:20px;">
        <h2>Welcome to LastMile</h2>
        <p>Your OTP for verification is:</p>
        <h1 style="color:#007bff;">${otp}</h1>
        <p>This OTP will expire in <b>5 minutes</b>.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(` OTP sent to ${to}`);
  } catch (err) {
    console.error(" Error sending email:", err);
  }
};
