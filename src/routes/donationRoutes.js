import express from "express";
import {
    createDonation,
    getAvailableDonations,
    acceptDonation,
    confirmPickup,
    getUserDonations,
    deleteDonation,
    volunteerAcceptTask,
    getExpiredDonationsForPartner, // ✅ NEW
    acceptExpiredDonation // ✅ NEW
} from "../controllers/donationController.js";
import { authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleCheck.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ---------------- RESTAURANT ---------------- */
router.post(
    "/",
    authenticate,
    allowRoles("restaurant"),
    upload.single("image"),
    createDonation
);

/* ---------------- NGO & VOLUNTEER ---------------- */
router.get(
    "/available",
    authenticate,
    allowRoles("ngo", "volunteer"),
    getAvailableDonations
);

router.post(
    "/:id/accept",
    authenticate,
    allowRoles("ngo"),
    acceptDonation
);

router.post(
    "/:id/volunteer-accept",
    authenticate,
    allowRoles("volunteer"),
    volunteerAcceptTask
);

router.post(
    "/:id/confirm",
    authenticate,
    allowRoles("ngo", "volunteer", "waste_partner"), // ✅ allow waste partner
    confirmPickup
);

/* ---------------- COMMON ---------------- */
router.get(
    "/mine",
    authenticate,
    getUserDonations
);

router.delete(
    "/:id",
    authenticate,
    allowRoles("restaurant"),
    deleteDonation
);

/* ================= WASTE PARTNER (NEW) ================= */

// View expired donations
router.get(
    "/expired",
    authenticate,
    allowRoles("waste_partner"),
    getExpiredDonationsForPartner
);

// Accept expired donation for recycling
router.post(
    "/:id/recycle-accept",
    authenticate,
    allowRoles("waste_partner"),
    acceptExpiredDonation
);

export default router;