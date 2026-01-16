import Donation from "../models/Donation.js";
import { generateQrToken, validateQrToken } from "../utils/qrGenerator.js";

/* -------------------- CREATE DONATION -------------------- */
export const createDonation = async function(req, res) {
    try {
        const title = req.body.title;
        const quantity = Number(req.body.quantity);
        const type = req.body.type;
        const madeAt = req.body.madeAt;
        const expiresAt = req.body.expiresAt;
        const pinCode = req.body.pinCode;
        const zone = req.body.zone || "";
        const freshnessScore = req.body.freshnessScore || "Fresh";
        const imageBase64 = req.body.imageBase64;

        const labelsRaw =
            typeof req.body.labels === "string" ?
            req.body.labels :
            Array.isArray(req.body.labels) ?
            req.body.labels.join(",") :
            "";

        if (!title || !quantity || !type || !madeAt || !expiresAt || !pinCode) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let imageData = null;
        if (imageBase64 && imageBase64.startsWith("data:image")) {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            imageData = {
                data: Buffer.from(base64Data, "base64"),
                contentType: getImageContentType(imageBase64),
            };
        }

        const labels = labelsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const donation = new Donation({
            donorId: req.user._id,
            title,
            quantity,
            type,
            labels,
            images: imageData ? [imageData] : [],
            madeAt,
            expiresAt,
            pinCode,
            zone,
            freshnessScore,
        });

        donation.qrToken = generateQrToken(donation._id);
        await donation.save();

        return res.status(201).json(donation);
    } catch (err) {
        console.error("createDonation error:", err);
        return res.status(500).json({ message: "Failed to create donation" });
    }
};

/* -------------------- DELETE DONATION -------------------- */
export const deleteDonation = async function(req, res) {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: "Not found" });

        if (String(donation.donorId) !== String(req.user._id)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (donation.status !== "available") {
            return res
                .status(400)
                .json({ message: "Only available donations can be deleted" });
        }

        await Donation.findByIdAndDelete(req.params.id);
        res.json({ message: "Donation deleted" });
    } catch (err) {
        console.error("deleteDonation error:", err);
        res.status(500).json({ message: "Delete failed" });
    }
};

/* -------------------- GET AVAILABLE DONATIONS -------------------- */
export const getAvailableDonations = async function(req, res) {
    try {
        const pin = req.query.pin;
        if (!pin) return res.status(400).json({ message: "PIN required" });

        const filter = {
            status: "available",
            pinCode: pin,
            expiresAt: { $gt: new Date() }, // safety
        };

        if (req.query.type) filter.type = req.query.type;

        const donations = await Donation.find(filter).sort({ expiresAt: 1 });
        res.json(donations);
    } catch (err) {
        console.error("getAvailableDonations error:", err);
        res.status(500).json({ message: "Fetch failed" });
    }
};

/* -------------------- NGO ACCEPT DONATION -------------------- */
export const acceptDonation = async function(req, res) {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: "Not found" });

        if (donation.status !== "available") {
            return res.status(400).json({ message: "Donation not available" });
        }

        if (new Date() > new Date(donation.expiresAt)) {
            return res.status(400).json({ message: "Donation has expired" });
        }

        donation.status = "accepted";
        donation.acceptedBy = req.user._id;
        donation.volunteerId = null;

        await donation.save();
        res.json({ message: "Accepted", donation });
    } catch (err) {
        console.error("acceptDonation error:", err);
        res.status(500).json({ message: "Accept failed" });
    }
};

/* -------------------- VOLUNTEER ACCEPT TASK -------------------- */
export const volunteerAcceptTask = async function(req, res) {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: "Not found" });

        if (donation.status !== "accepted") {
            return res.status(400).json({ message: "Donation not accepted by NGO" });
        }

        if (donation.volunteerId) {
            return res.status(400).json({ message: "Task already taken" });
        }

        donation.volunteerId = req.user._id;
        await donation.save();

        res.json({ message: "Task accepted", donation });
    } catch (err) {
        console.error("volunteerAcceptTask error:", err);
        res.status(500).json({ message: "Failed to accept task" });
    }
};

/* -------------------- CONFIRM PICKUP / RECYCLE -------------------- */
export const confirmPickup = async function(req, res) {
    try {
        const { qrToken } = req.body;
        if (!qrToken) {
            return res.status(400).json({ message: "QR token required" });
        }

        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        // 🔓 MVP MODE:
        // Skip strict QR validation for expired donations (recycling)
        if (donation.status !== "expired") {
            if (!validateQrToken(qrToken, donation)) {
                return res.status(400).json({ message: "Invalid QR token" });
            }
        }

        // 🔥 ROLE-AWARE CONFIRMATION
        if (donation.status === "expired") {
            donation.status = "recycled";
            donation.recycledBy = req.user._id;
        } else {
            donation.status = "completed";
        }

        await donation.save();
        res.json({ message: "Pickup confirmed", donation });
    } catch (err) {
        console.error("confirmPickup error:", err);
        res.status(500).json({ message: "Failed to confirm pickup" });
    }
};

/* -------------------- USER DONATIONS -------------------- */
export const getUserDonations = async function(req, res) {
    try {
        const role = req.user.role;
        let filter = {};

        if (role === "restaurant") filter.donorId = req.user._id;
        if (role === "ngo") filter.acceptedBy = req.user._id;
        if (role === "volunteer") filter.volunteerId = req.user._id;
        if (role === "waste_partner") filter.recycledBy = req.user._id;

        const donations = await Donation.find(filter).sort({ createdAt: -1 });
        res.json(donations);
    } catch (err) {
        console.error("getUserDonations error:", err);
        res.status(500).json({ message: "Fetch failed" });
    }
};

/* -------------------- HELPERS -------------------- */
const getImageContentType = (base64String) => {
    if (base64String.startsWith("data:image/jpeg")) return "image/jpeg";
    if (base64String.startsWith("data:image/png")) return "image/png";
    if (base64String.startsWith("data:image/gif")) return "image/gif";
    if (base64String.startsWith("data:image/webp")) return "image/webp";
    return "image/jpeg";
};