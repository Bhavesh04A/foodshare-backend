import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import ngoRoutes from "./routes/ngoRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import cron from "node-cron";
import { expireDonationsJob } from "./utils/expireDonations.js";
import wasteRoutes from "./routes/wasteRoutes.js";



/* CRON — runs every 5 minutes */
cron.schedule("*/5 * * * *", expireDonationsJob);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use("/donations", donationRoutes);
app.use("/ai", aiRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/ngo", ngoRoutes);
app.use("/volunteer", volunteerRoutes);
app.use("/api/stats", statsRoutes);
app.use("/waste", wasteRoutes);



app.get("/", (req, res) => {
    res.send("FoodShare backend is running 🚀");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal server error" });
});

export default app;