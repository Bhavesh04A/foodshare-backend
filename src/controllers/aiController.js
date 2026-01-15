import { geminiChat } from "../config/gemini.js";


// -----------------------------------------------------
// 1) CHAT — conversational, human-like responses
// -----------------------------------------------------
export const chat = async function(req, res) {
    try {
        const message = req.body && req.body.message ? req.body.message : null;

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const prompt =
            "You are a friendly and helpful AI assistant for FoodShare. " +
            "Respond in clear conversational paragraphs without Markdown, lists, stars, or bullets. " +
            "Do not use asterisks, bold text, headings, or symbols. " +
            "Speak naturally like a human.\n\n" +
            "User: " + message;

        const reply = await geminiChat(prompt);
        return res.json({ reply });

    } catch (err) {
        console.error("Chat error:", err);
        return res.status(500).json({ message: "AI chat failed" });
    }
};



// -----------------------------------------------------
// 2) FRESHNESS 
// (NO real-time, NO currentTime, NO countdown)
// -----------------------------------------------------
export const freshness = async function(req, res) {
    try {
        const body = req.body || {};

        const title = body.title || "";
        const quantity = body.quantity || "";
        const madeAt = body.madeAt || "";
        const expiresAt = body.expiresAt || "";

        // 🔥 REAL-TIME CALCULATION
        const now = new Date().getTime();
        const expiryTime = new Date(expiresAt).getTime();
        const diffHours = Math.floor((expiryTime - now) / (1000 * 60 * 60));

        let timeStatus = "Fresh";
        if (diffHours <= 1) timeStatus = "High Risk";
        else if (diffHours <= 3) timeStatus = "Consume Soon";

        const prompt =
            "Return ONLY valid JSON.\n" +
            "Do not add extra text.\n\n" +
            "{\n" +
            '  "score": "' + timeStatus + '",\n' +
            '  "reason": "short explanation"\n' +
            "}\n\n" +
            "Food: " + title + "\n" +
            "Quantity: " + quantity + "\n" +
            "Hours left before expiry: " + diffHours;

        const raw = await geminiChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return res.json({
                score: timeStatus,
                reason: "Food expires in about " + diffHours + " hours."
            });
        }

        try {
            const parsed = JSON.parse(raw.substring(start, end + 1));
            return res.json(parsed);
        } catch {
            return res.json({
                score: timeStatus,
                reason: "Food expires in about " + diffHours + " hours."
            });
        }

    } catch (err) {
        console.error("Freshness error:", err);
        return res.json({
            score: "Consume Soon",
            reason: "Food safety could not be evaluated accurately."
        });
    }
};




// -----------------------------------------------------
// 3) SUGGESTIONS 
// -----------------------------------------------------
export const suggestions = async function(req, res) {
    try {
        const body = req.body || {};

        const title = body.title || "";
        const type = body.type || "";

        const prompt =
            "Return ONLY valid JSON.\n" +
            "Do not add extra text.\n\n" +
            "{\n" +
            '  "labels": ["label1", "label2", "label3"],\n' +
            '  "description": "short natural description"\n' +
            "}\n\n" +
            "Food: " + title + "\n" +
            "Food type: " + type + "\n" +
            "Context: surplus food donation";

        const raw = await geminiChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return res.json({
                labels: [type, "Freshly Cooked", "Safe to Donate"],
                description: "Fresh surplus food suitable for donation."
            });
        }

        try {
            const parsed = JSON.parse(raw.substring(start, end + 1));
            return res.json(parsed);
        } catch {
            return res.json({
                labels: [type, "Freshly Cooked", "Safe to Donate"],
                description: "Fresh surplus food suitable for donation."
            });
        }

    } catch (err) {
        console.error("Suggestions error:", err);
        return res.json({
            labels: ["Fresh Food", "Safe Donation"],
            description: "Fresh food prepared for donation."
        });
    }
};