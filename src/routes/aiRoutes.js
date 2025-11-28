import express from "express";
import { authenticate } from "../middleware/auth.js";
import { chat, freshness, suggestions } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", authenticate, chat);
router.post("/freshness", authenticate, freshness);
router.post("/suggestions", authenticate, suggestions);

export default router;