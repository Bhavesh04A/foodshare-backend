import express from "express";
import {
    createDonation,
    getAvailableDonations,
    acceptDonation,
    confirmPickup,
    getUserDonations,
    deleteDonation,
    volunteerAcceptTask
} from "../controllers/donationController.js";
import { authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleCheck.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Restaurant creates donation
router.post(
    "/",
    authenticate,
    allowRoles("restaurant"),
    upload.single("image"),
    createDonation
);

// NGO & Volunteer can view available donations
router.get(
    "/available",
    authenticate,
    allowRoles("ngo", "volunteer"),
    getAvailableDonations
);

// NGO accepts donation (marks status = accepted)
router.post(
    "/:id/accept",
    authenticate,
    allowRoles("ngo"),
    acceptDonation
);

// Volunteer accepts task (assigns volunteerId)
router.post(
    "/:id/volunteer-accept",
    authenticate,
    allowRoles("volunteer"),
    volunteerAcceptTask
);

// NGO or Volunteer confirms pickup using QR
router.post(
    "/:id/confirm",
    authenticate,
    allowRoles("ngo", "volunteer"),
    confirmPickup
);

// Each user (restaurant, ngo, volunteer) fetches their own donations
router.get(
    "/mine",
    authenticate,
    getUserDonations
);

// Restaurant deletes donation
router.delete(
    "/:id",
    authenticate,
    allowRoles("restaurant"),
    deleteDonation
);

export default router;