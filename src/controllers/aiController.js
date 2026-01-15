import { geminiChat } from "../config/gemini.js";


// -----------------------------------------------------
// 1) CHAT — conversational, human-like responses
// -----------------------------------------------------
export const chat = async function(req, res) {
    try {
        const message = req.body && req.body.message ? req.body.message : "";

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const prompt =
            "You are a friendly food safety assistant. " +
            "Reply in 2 to 4 short sentences. " +
            "Do NOT use markdown, headings, lists, tables, or bullet points. " +
            "Speak naturally like a human.\n\n" +
            message;

        const reply = await geminiChat(prompt);

        return res.json({ reply });
    } catch (err) {
        console.error("Chat error:", err);
        return res.status(500).json({ message: "AI chat failed" });
    }
};


/* =========================
   2) FRESHNESS
========================= */
export const freshness = async function(req, res) {
    try {
        const body = req.body || {};

        const title = body.title || "";
        const quantity = body.quantity || "";
        const expiresAt = body.expiresAt || "";

        // ✅ SAFE TIME CALCULATION
        const now = Date.now();
        const expiry = new Date(expiresAt).getTime();

        if (!expiry || isNaN(expiry)) {
            return res.json({
                score: "Consume Soon",
                reason: "Expiry time could not be verified."
            });
        }

        const diffMs = expiry - now;
        const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

        let score = "Fresh";
        if (diffHours <= 1) score = "High Risk";
        else if (diffHours <= 4) score = "Consume Soon";

        const prompt =
            "Return ONLY valid JSON.\n\n" +
            "{\n" +
            '  "score": "' + score + '",\n' +
            '  "reason": "short explanation"\n' +
            "}\n\n" +
            "Food: " + title + "\n" +
            "Quantity: " + quantity + "\n" +
            "Hours left: " + diffHours;

        const raw = await geminiChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start !== -1 && end !== -1) {
            try {
                return res.json(JSON.parse(raw.substring(start, end + 1)));
            } catch {}
        }

        // ✅ SAFE FALLBACK
        return res.json({
            score: score,
            reason: "Food expires in about " + diffHours + " hours."
        });

    } catch (err) {
        console.error("Freshness error:", err);
        return res.json({
            score: "Consume Soon",
            reason: "Unable to evaluate freshness accurately."
        });
    }
};


/* =========================
   3) SUGGESTIONS
========================= */
export const suggestions = async function(req, res) {
    try {
        const body = req.body || {};

        const title = body.title || "";
        const type = body.type || "";

        const prompt =
            "You are an AI helping with surplus food donation.\n" +
            "Suggest labels based on the food item and type.\n\n" +
            "Return ONLY valid JSON.\n\n" +
            "{\n" +
            '  "labels": ["label1", "label2", "label3"],\n' +
            '  "description": "short natural description"\n' +
            "}\n\n" +
            "Food item: " + title + "\n" +
            "Food type: " + type;

        const raw = await geminiChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start !== -1 && end !== -1) {
            try {
                return res.json(JSON.parse(raw.substring(start, end + 1)));
            } catch {}
        }

        // ✅ SMART FALLBACK
        return res.json({
            labels: [
                type || "Food",
                "Freshly Prepared",
                "Suitable for Donation"
            ],
            description: "Surplus " + title + " that can be safely donated if handled properly."
        });

    } catch (err) {
        console.error("Suggestions error:", err);
        return res.json({
            labels: ["Food", "Safe Donation"],
            description: "Food prepared for donation."
        });
    }
};