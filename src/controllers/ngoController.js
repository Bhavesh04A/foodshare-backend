import User from "../models/User.js";

export const verifyNgo = async(req, res) => {
    try {
        const ngoId = req.params.id;
        const ngo = await User.findById(ngoId);
        if (!ngo || ngo.role !== "ngo") {
            return res.status(404).json({ message: "NGO not found" });
        }
        ngo.verified = true;
        await ngo.save();

        res.json({ message: "NGO verified", ngo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to verify NGO" });
    }
};