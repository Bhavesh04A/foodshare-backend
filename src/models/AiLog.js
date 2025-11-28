import mongoose from "mongoose";

const aiLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    query: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
});

export default mongoose.model("AiLog", aiLogSchema);