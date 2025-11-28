import { groqChat } from "../config/groq.js";

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

        const reply = await groqChat(prompt);
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


        const prompt =
            "Evaluate freshness of this food item and return ONLY JSON.\n" +
            "Do not add additional text.\n\n" +
            "Title: " + title + "\n" +
            "Quantity: " + quantity + "\n" +
            "Made At: " + madeAt + "\n" +
            "Expires At: " + expiresAt + "\n\n" +
            "Return JSON strictly in this format:\n" +
            "{\n" +
            '  "score": "Fresh" | "Consume Soon" | "High Risk",\n' +
            '  "reason": "short explanation like: expires in 3 hours"\n' +
            "}";

        const raw = await groqChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return res.status(500).json({ message: "AI returned invalid JSON" });
        }

        const jsonStr = raw.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);

        return res.json(parsed);

    } catch (err) {
        console.error("Freshness error:", err);
        return res.status(500).json({ message: "Freshness check failed" });
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
            "You are FoodShare AI. Suggest 2–4 useful donation labels and a short, simple human description.\n" +
            "Return STRICT JSON only.\n\n" +
            "Food: " + title + "\n" +
            "Type: " + type + "\n\n" +
            "Format:\n" +
            "{\n" +
            '  "labels": ["label1", "label2"],\n' +
            '  "description": "short natural description"\n' +
            "}";

        const raw = await groqChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return res.status(500).json({ message: "AI returned invalid JSON" });
        }

        const jsonStr = raw.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);

        return res.json(parsed);

    } catch (err) {
        console.error("Suggestions error:", err);
        return res.status(500).json({ message: "Suggestions generation failed" });
    }
};