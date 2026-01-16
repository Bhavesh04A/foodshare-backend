import Donation from "../models/Donation.js";
import { validateQrToken } from "../utils/qrGenerator.js";

export const getExpiredDonations = async(req, res) => {
    const donations = await Donation.find({ status: "expired" }).sort({
        expiresAt: 1,
    });
    res.json(donations);
};

export const acceptForRecycling = async(req, res) => {
    const donation = await Donation.findById(req.params.id);

    if (!donation || donation.status !== "expired") {
        return res.status(400).json({ message: "Not recyclable" });
    }

    donation.status = "picked";
    donation.recycledBy = req.user._id;
    await donation.save();

    res.json({ message: "Accepted for recycling", donation });
};

export const confirmRecyclePickup = async(req, res) => {
    const donation = await Donation.findById(req.params.id);

    if (!validateQrToken(req.body.qrToken, donation)) {
        return res.status(400).json({ message: "Invalid QR" });
    }

    donation.status = "recycled";
    await donation.save();

    res.json({ message: "Recycled successfully", donation });
};