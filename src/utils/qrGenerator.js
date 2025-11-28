import crypto from "crypto";

export const generateQrToken = (donationId) => {
    const randomToken = crypto.randomBytes(8).toString("hex");
    return `${donationId}:${randomToken}`;
};

export const validateQrToken = (token, donation) => {
    // donation.qrToken should be the original generated token
    return token === donation.qrToken;
};