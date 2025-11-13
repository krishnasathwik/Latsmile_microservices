import dotenv from "dotenv";
dotenv.config();
console.log("✅ ENV LOADED:", process.env.EMAIL_USER ? "YES" : "NO");
