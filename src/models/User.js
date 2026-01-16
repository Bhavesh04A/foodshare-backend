import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxLength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["restaurant", "ngo", "volunteer", "waste_partner"], required: true },
    pinCode: { type: String, required: true },
    zone: { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    verified: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    badges: [{ type: String }],
}, { timestamps: true });

export default mongoose.model("User", userSchema);