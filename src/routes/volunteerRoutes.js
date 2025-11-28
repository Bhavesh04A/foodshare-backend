import express from "express";
import { authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleCheck.js";
import { getVolunteerTasks } from "../controllers/volunteerController.js";

const router = express.Router();

router.get("/tasks", authenticate, allowRoles("volunteer"), getVolunteerTasks);

export default router;