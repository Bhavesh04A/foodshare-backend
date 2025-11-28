export const proximityLevel = (userPin, userZone, donationPin, donationZone) => {
    if (userPin === donationPin) return "very near";
    if (userZone && userZone === donationZone) return "near";
    return "far";
};