import Donation from "../models/Donation.js";

export const getVolunteerTasks = async function(req, res) {
    try {
        const tasks = await Donation.find({
                $or: [
                    // Volunteer sees unassigned accepted tasks
                    { status: "accepted", volunteerId: null },

                    // AND tasks already assigned to them
                    { volunteerId: req.user._id }
                ]
            })
            .sort({ expiresAt: 1 })
            .lean();

        return res.json(tasks);
    } catch (error) {
        console.error("getVolunteerTasks error:", error);
        return res.status(500).json({ message: "Failed to fetch volunteer tasks" });
    }
};