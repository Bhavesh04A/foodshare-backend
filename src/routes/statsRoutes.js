import express from "express";
import { authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleCheck.js";
import {
    getRestaurantStats,
    getNGOStats,
    getVolunteerStats
} from "../controllers/statsController.js";

const router = express.Router();

router.get("/restaurant", authenticate, allowRoles("restaurant"), getRestaurantStats);
router.get("/ngo", authenticate, allowRoles("ngo"), getNGOStats);
router.get("/volunteer", authenticate, allowRoles("volunteer"), getVolunteerStats);

export default router;