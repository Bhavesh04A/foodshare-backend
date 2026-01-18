import Donation from "../models/Donation.js";
import { generateQrToken, validateQrToken } from "../utils/qrGenerator.js";

/* ================= HELPER ================= */
const calculateUrgency = (expiresAt) => {
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    if (!expiry || isNaN(expiry)) return false;
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    return diffHours <= 3;
};

/* ================= AUTO EXPIRY HELPER ================= */
const autoExpireDonation = async(donation) => {
    if (
        donation.status === "available" &&
        Date.now() > new Date(donation.expiresAt).getTime()
    ) {
        donation.status = "expired";
        await donation.save();
    }
};

/* -------------------- CREATE DONATION -------------------- */
export const createDonation = async(req, res) => {
    try {
        const {
            title,
            quantity,
            type,
            madeAt,
            expiresAt,
            pinCode,
            zone = "",
            freshnessScore = "Fresh",
            imageBase64
        } = req.body;

        if (!title || !quantity || !type || !madeAt || !expiresAt || !pinCode) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let imageData = null;
        if (imageBase64 && imageBase64.startsWith("data:image")) {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            imageData = {
                data: Buffer.from(base64Data, "base64"),
                contentType: "image/jpeg"
            };
        }

        const donation = new Donation({
            donorId: req.user._id,
            title,
            quantity,
            type,
            images: imageData ? [imageData] : [],
            madeAt,
            expiresAt,
            pinCode,
            zone,
            freshnessScore,
            isUrgent: calculateUrgency(expiresAt),
            qrToken: generateQrToken(req.user._id)
        });

        await donation.save();
        res.status(201).json(donation);
    } catch {
        res.status(500).json({ message: "Failed to create donation" });
    }
};

/* -------------------- DELETE -------------------- */
export const deleteDonation = async(req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: "Not found" });
        if (String(donation.donorId) !== String(req.user._id))
            return res.status(403).json({ message: "Forbidden" });

        if (donation.status !== "available") {
            return res
                .status(400)
                .json({ message: "Only available donations can be deleted" });
        }

        await Donation.findByIdAndDelete(req.params.id);
        res.json({ message: "Donation deleted" });
    } catch {
        res.status(500).json({ message: "Delete failed" });
    }
};

/* -------------------- GET AVAILABLE -------------------- */
export const getAvailableDonations = async(req, res) => {
    try {
        const { pin, type } = req.query;
        if (!pin) return res.status(400).json({ message: "PIN required" });

        const filter = { status: "available", pinCode: pin };
        if (type) filter.type = type;

        const donations = await Donation.find(filter).sort({ expiresAt: 1 });

        res.json(donations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Fetch failed" });
    }
};



/* -------------------- NGO ACCEPT -------------------- */
export const acceptDonation = async(req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation || donation.status !== "available") {
            return res.status(400).json({ message: "Not available" });
        }

        donation.status = "accepted";
        donation.acceptedBy = req.user._id;
        await donation.save();

        res.json({ message: "Accepted", donation });
    } catch {
        res.status(500).json({ message: "Accept failed" });
    }
};

/* -------------------- VOLUNTEER ACCEPT -------------------- */
export const volunteerAcceptTask = async(req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation || donation.status !== "accepted") {
            return res.status(400).json({ message: "Not accepted" });
        }

        donation.volunteerId = req.user._id;
        await donation.save();

        res.json({ message: "Task accepted", donation });
    } catch {
        res.status(500).json({ message: "Failed" });
    }
};

/* -------------------- CONFIRM PICKUP -------------------- */
export const confirmPickup = async(req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!validateQrToken(req.body.qrToken, donation)) {
            return res.status(400).json({ message: "Invalid QR token" });
        }

        if (donation.status === "expired") {
            donation.status = "recycled";
        } else {
            donation.status = "completed";
        }

        await donation.save();
        res.json({ message: "Pickup confirmed", donation });
    } catch {
        res.status(500).json({ message: "Failed" });
    }
};

/* ================= WASTE PARTNER ================= */

/* ---- GET EXPIRED ---- */
export const getExpiredDonationsForPartner = async(req, res) => {
    try {
        const donations = await Donation.find({
            status: { $in: ["expired", "picked", "recycled", "completed"] }
        }).sort({ updatedAt: -1 });

        res.json(donations);
    } catch {
        res.status(500).json({ message: "Failed to fetch expired donations" });
    }
};


/* ---- ACCEPT FOR RECYCLING ---- */
export const acceptExpiredDonation = async(req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation || donation.status !== "expired") {
            return res.status(400).json({ message: "Not expired" });
        }

        donation.status = "recycled"; // ✅ FIX
        donation.acceptedBy = req.user._id;

        await donation.save();
        res.json({ message: "Picked for recycling", donation });
    } catch {
        res.status(500).json({ message: "Failed" });
    }
};


/* -------------------- USER DONATIONS -------------------- */
export const getUserDonations = async(req, res) => {
    try {
        let donations = [];
        if (req.user.role === "restaurant") {
            donations = await Donation.find({ donorId: req.user._id });
        } else {
            donations = await Donation.find({ acceptedBy: req.user._id });
        }

        // ✅ AUTO-EXPIRE FIX (DO NOT REMOVE)
        for (const d of donations) {
            await autoExpireDonation(d);
        }

        res.json(donations);
    } catch {
        res.status(500).json({ message: "Fetch failed" });
    }
};