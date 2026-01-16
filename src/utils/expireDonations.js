import Donation from "../models/Donation.js";

export const expireDonationsJob = async() => {
    try {
        const now = new Date();

        const result = await Donation.updateMany({
            status: "available",
            expiresAt: { $lt: now },
        }, {
            $set: { status: "expired" },
        });

        if (result.modifiedCount > 0) {
            console.log(`Expired ${result.modifiedCount} donations`);
        }
    } catch (error) {
        console.error("Expire donations cron failed:", error);
    }
};