import Donation from "../models/Donation.js";

export const getImpact = async(req, res) => {
    try {
        const donations = await Donation.find({ status: "completed" });
        const mealsSaved = donations.reduce((sum, d) => sum + d.quantity, 0);
        const co2Saved = mealsSaved * 1.5;

        res.json({ mealsSaved, co2Saved });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get impact analytics" });
    }
};

export const getStreak = async(req, res) => {
    try {
        const user = req.user;
        res.json({ streak: user.streak || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get streak" });
    }
};