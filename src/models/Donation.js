import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    type: { type: String, enum: ["veg", "non-veg"], required: true },
    labels: [{ type: String }],
    images: [{
        data: Buffer,
        contentType: String
    }],
    madeAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    pinCode: { type: String, required: true },
    zone: { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    status: {
        type: String,
        enum: ["available", "accepted", "picked", "completed"],
        default: "available",
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // NGO user
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // volunteer user
    qrToken: { type: String, required: true },
    freshnessScore: { type: String }, // e.g., "Fresh", "Consume Soon", "High Risk"
}, { timestamps: true });

export default mongoose.model("Donation", donationSchema);