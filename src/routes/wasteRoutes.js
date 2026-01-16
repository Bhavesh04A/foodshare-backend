import express from "express";
import { authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleCheck.js";
import {
    getExpiredDonations,
    acceptForRecycling,
    confirmRecyclePickup,
} from "../controllers/wasteController.js";

const router = express.Router();

router.get(
    "/expired",
    authenticate,
    allowRoles("waste_partner"),
    getExpiredDonations
);

router.post(
    "/:id/accept",
    authenticate,
    allowRoles("waste_partner"),
    acceptForRecycling
);

router.post(
    "/:id/confirm",
    authenticate,
    allowRoles("waste_partner"),
    confirmRecyclePickup
);

export default router;