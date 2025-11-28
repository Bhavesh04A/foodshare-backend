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

        /* -------------------- MONGODB IMAGE STORAGE -------------------- */
        let imageData = null;
        if (imageBase64 && imageBase64.startsWith('data:image')) {
            try {
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                imageData = {
                    data: Buffer.from(base64Data, 'base64'),
                    contentType: getImageContentType(imageBase64)
                };
                console.log("Image stored successfully, size:", base64Data.length);
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }

        const labels = labelsRaw
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);

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

// Helper function to get content type from Base64 string
const getImageContentType = (base64String) => {
    if (base64String.startsWith('data:image/jpeg')) return 'image/jpeg';
    if (base64String.startsWith('data:image/png')) return 'image/png';
    if (base64String.startsWith('data:image/gif')) return 'image/gif';
    if (base64String.startsWith('data:image/webp')) return 'image/webp';
    return 'image/jpeg';
};

/* -------------------- DELETE -------------------- */
export const deleteDonation = async function(req, res) {
    try {
        const id = req.params.id;
        const donation = await Donation.findById(id);

        if (!donation) return res.status(404).json({ message: "Not found" });

        if (String(donation.donorId) !== String(req.user._id)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (donation.status !== "available") {
            return res
                .status(400)
                .json({ message: "Only available donations can be deleted" });
        }

        await Donation.findByIdAndDelete(id);
        return res.json({ message: "Donation deleted" });
    } catch (err) {
        console.error("deleteDonation error:", err);
        return res.status(500).json({ message: "Delete failed" });
    }
};

/* -------------------- GET AVAILABLE -------------------- */
export const getAvailableDonations = async function(req, res) {
    try {
        const pin = req.query.pin;
        if (!pin) return res.status(400).json({ message: "PIN required" });

        const type = req.query.type;
        const filter = { status: "available", pinCode: pin };
        if (type) filter.type = type;

        const donations = await Donation.find(filter).sort({ expiresAt: 1 });
        return res.json(donations);
    } catch (err) {
        console.error("getAvailableDonations error:", err);
        return res.status(500).json({ message: "Fetch failed" });
    }
};

/* -------------------- ACCEPT DONATION (NGO) -------------------- */
export const acceptDonation = async function(req, res) {
    try {
        const id = req.params.id;
        const donation = await Donation.findById(id);

        if (!donation) return res.status(404).json({ message: "Not found" });

        if (donation.status !== "available")
            return res.status(400).json({ message: "Not available" });

        donation.status = "accepted";
        donation.acceptedBy = req.user._id;
        donation.volunteerId = null;

        await donation.save();

        return res.json({ message: "Accepted", donation });
    } catch (err) {
        console.error("acceptDonation error:", err);
        return res.status(500).json({ message: "Accept failed" });
    }
};

/* -------------------- VOLUNTEER ACCEPT TASK -------------------- */
export const volunteerAcceptTask = async function(req, res) {
    try {
        const id = req.params.id;
        const volunteerId = req.user._id;

        const donation = await Donation.findById(id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        if (donation.status !== "accepted") {
            return res
                .status(400)
                .json({ message: "Donation not accepted by NGO" });
        }

        if (donation.volunteerId) {
            return res.status(400).json({ message: "Task already taken" });
        }

        donation.volunteerId = volunteerId;
        await donation.save();

        return res.json({ message: "Task accepted", donation });
    } catch (err) {
        console.error("volunteerAcceptTask error:", err);
        return res.status(500).json({ message: "Failed to accept task" });
    }
};

/* -------------------- CONFIRM PICKUP -------------------- */
export const confirmPickup = async function(req, res) {
    try {
        const id = req.params.id;
        const qrToken = req.body.qrToken;

        if (!qrToken)
            return res.status(400).json({ message: "QR token required" });

        const donation = await Donation.findById(id);
        if (!donation)
            return res.status(404).json({ message: "Donation not found" });

        if (!validateQrToken(qrToken, donation)) {
            return res.status(400).json({ message: "Invalid QR token" });
        }

        donation.status = "completed";
        await donation.save();

        return res.json({ message: "Pickup confirmed", donation });
    } catch (err) {
        console.error("confirmPickup error:", err);
        return res.status(500).json({ message: "Failed to confirm pickup" });
    }
};

/* -------------------- USER DONATIONS -------------------- */
export const getUserDonations = async function(req, res) {
    try {
        const role = req.user.role;
        let donations = [];

        if (role === "restaurant") {
            donations = await Donation.find({ donorId: req.user._id }).sort({
                createdAt: -1,
            });
        } else if (role === "ngo") {
            donations = await Donation.find({
                acceptedBy: req.user._id,
            }).sort({ createdAt: -1 });
        } else if (role === "volunteer") {
            donations = await Donation.find({
                $or: [
                    { volunteerId: req.user._id },
                    { acceptedBy: req.user._id },
                ],
            }).sort({ createdAt: -1 });
        }

        return res.json(donations);
    } catch (err) {
        console.error("getUserDonations error:", err);
        return res.status(500).json({ message: "Fetch failed" });
    }
};