import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import engagementRoutes from "./routes/engagementRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import helpdeskRoutes from "./routes/helpdeskRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { seedAdmin } from "./services/seedAdmin.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const configuredOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowedOrigins = [
  ...configuredOrigins,
  "http://localhost:5173",
  "https://hr-dashboard-y5nl.vercel.app"
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "HR Dashboard API is running",
    health: "/api/health"
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/engagement", engagementRoutes);
app.use("/api/helpdesk", helpdeskRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : "Something went wrong"
  });
});

connectDB()
  .then(seedAdmin)
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
