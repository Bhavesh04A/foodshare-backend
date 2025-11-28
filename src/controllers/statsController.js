import Donation from "../models/Donation.js";
import User from "../models/User.js";

export const getRestaurantStats = async(req, res) => {
    try {
        const restaurantId = req.user._id;
        console.log('=== RESTAURANT STATS DEBUG ===');
        console.log('Restaurant ID:', restaurantId);

        const allDonations = await Donation.find({ donorId: restaurantId });
        console.log('All donations for restaurant:', allDonations);
        console.log('Total donations count:', allDonations.length);

        const totalDonations = await Donation.countDocuments({ donorId: restaurantId });
        const completedDonations = await Donation.countDocuments({
            donorId: restaurantId,
            status: "completed"
        });

        console.log('Total donations:', totalDonations);
        console.log('Completed donations:', completedDonations);

        const donations = await Donation.find({ donorId: restaurantId, status: "completed" });
        console.log('Completed donations details:', donations);

        const mealsShared = donations.reduce((total, donation) => total + donation.quantity, 0);
        console.log('Meals shared calculated:', mealsShared);

        const activeDonations = await Donation.countDocuments({
            donorId: restaurantId,
            status: { $in: ["available", "accepted"] }
        });

        // Calculate CO₂ saved (rough estimate: 2.5kg CO₂ per kg of food saved)
        const co2Saved = Math.round(mealsShared * 2.5);

        // Calculate rating (placeholder - you can implement real rating system)
        const rating = totalDonations > 0 ? (4.5 + Math.random() * 0.5).toFixed(1) : "0.0";

        const result = {
            totalDonations,
            completedDonations,
            activeDonations,
            mealsShared,
            co2Saved: `${co2Saved}kg`,
            rating: `${rating}★`,
            completionRate: totalDonations > 0 ? `${Math.round((completedDonations / totalDonations) * 100)}%` : "0%"
        };

        console.log('Final stats result:', result);
        console.log('=== END RESTAURANT STATS DEBUG ===');

        res.json(result);
    } catch (error) {
        console.error("getRestaurantStats error:", error);
        res.status(500).json({ message: "Failed to fetch restaurant stats" });
    }
};

export const getNGOStats = async(req, res) => {
    try {
        const ngoId = req.user._id;
        console.log('=== NGO STATS DEBUG ===');
        console.log('NGO ID:', ngoId);

        const acceptedDonations = await Donation.countDocuments({ acceptedBy: ngoId });
        const completedDistributions = await Donation.countDocuments({
            acceptedBy: ngoId,
            status: "completed"
        });

        console.log('Accepted donations:', acceptedDonations);
        console.log('Completed distributions:', completedDistributions);

        // Calculate meals distributed
        const donations = await Donation.find({ acceptedBy: ngoId, status: "completed" });
        console.log('Completed NGO donations:', donations);

        const mealsDistributed = donations.reduce((total, donation) => total + donation.quantity, 0);
        console.log('Meals distributed calculated:', mealsDistributed);

        // Count partner restaurants (unique restaurants this NGO has worked with)
        const partnerRestaurants = await Donation.distinct('donorId', {
            acceptedBy: ngoId,
            status: "completed"
        });

        // Count active volunteers (volunteers who have completed tasks for this NGO)
        const activeVolunteers = await Donation.distinct('volunteerId', {
            acceptedBy: ngoId,
            volunteerId: { $ne: null }
        });

        const deliverySuccessRate = acceptedDonations > 0 ?
            `${Math.round((completedDistributions / acceptedDonations) * 100)}%` : "0%";

        const result = {
            mealsDistributed,
            activeVolunteers: activeVolunteers.length,
            partnerRestaurants: partnerRestaurants.length,
            deliverySuccessRate,
            acceptedDonations,
            completedDistributions,
            familiesServed: Math.round(mealsDistributed / 4)
        };

        console.log('Final NGO stats result:', result);
        console.log('=== END NGO STATS DEBUG ===');

        res.json(result);
    } catch (error) {
        console.error("getNGOStats error:", error);
        res.status(500).json({ message: "Failed to fetch NGO stats" });
    }
};

export const getVolunteerStats = async(req, res) => {
    try {
        const volunteerId = req.user._id;
        console.log('=== VOLUNTEER STATS DEBUG ===');
        console.log('Volunteer ID:', volunteerId);

        const deliveriesMade = await Donation.countDocuments({
            volunteerId: volunteerId,
            status: "completed"
        });

        const assignedTasks = await Donation.countDocuments({
            volunteerId: volunteerId,
            status: { $in: ["accepted", "picked"] }
        });

        console.log('Deliveries made:', deliveriesMade);
        console.log('Assigned tasks:', assignedTasks);

        // Calculate meals delivered and hours served
        const completedDeliveries = await Donation.find({
            volunteerId: volunteerId,
            status: "completed"
        });

        console.log('Completed volunteer deliveries:', completedDeliveries);

        const mealsDelivered = completedDeliveries.reduce((total, donation) => total + donation.quantity, 0);
        console.log('Meals delivered calculated:', mealsDelivered);

        // Estimate hours served (30 minutes per delivery + travel time)
        const hoursServed = Math.round((deliveriesMade * 1.5) * 10) / 10;

        // Calculate performance rating
        const totalAssignments = deliveriesMade + assignedTasks;
        const performanceRating = totalAssignments > 0 ?
            (4.0 + (deliveriesMade / totalAssignments) + Math.random() * 0.5).toFixed(1) : "0.0";

        const result = {
            deliveriesMade,
            assignedTasks,
            mealsDelivered,
            hoursServed,
            performanceRating: `${performanceRating}★`,
            completionRate: totalAssignments > 0 ? `${Math.round((deliveriesMade / totalAssignments) * 100)}%` : "0%"
        };

        console.log('Final volunteer stats result:', result);
        console.log('=== END VOLUNTEER STATS DEBUG ===');

        res.json(result);
    } catch (error) {
        console.error("getVolunteerStats error:", error);
        res.status(500).json({ message: "Failed to fetch volunteer stats" });
    }
};