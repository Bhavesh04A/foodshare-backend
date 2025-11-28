import express from "express";
import { authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleCheck.js";
import { verifyNgo } from "../controllers/ngoController.js";

const router = express.Router();

router.post("/:id/verify", authenticate, allowRoles("restaurant", "ngo", "volunteer"), verifyNgo);

export default router;