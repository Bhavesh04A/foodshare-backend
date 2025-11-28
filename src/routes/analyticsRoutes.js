import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getImpact, getStreak } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/impact", authenticate, getImpact);
router.get("/streak", authenticate, getStreak);

export default router;