import { geminiChat } from "../config/gemini.js";

/* -----------------------------
   1) CHAT
------------------------------ */
export const chat = async function(req, res) {
    try {
        const message =
            req.body && req.body.message ? req.body.message : null;

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const prompt =
            "You are a friendly and helpful AI assistant for FoodShare. " +
            "Respond in clear conversational paragraphs without Markdown, lists, stars, or bullets. " +
            "Speak naturally like a human.\n\nUser: " +
            message;

        const reply = await geminiChat(prompt);

        return res.json({
            reply: reply ||
                "Food safety depends on storage and timing. Please consume food within safe limits."
        });

    } catch (err) {
        console.error("Chat error:", err);
        return res.status(500).json({ message: "AI chat failed" });
    }
};

/* -----------------------------
   2) FRESHNESS
------------------------------ */
export const freshness = async function(req, res) {
    try {
        const body = req.body || {};

        const title = body.title || "";
        const quantity = body.quantity || "";
        const madeAt = body.madeAt || "";
        const expiresAt = body.expiresAt || "";

        const prompt =
            "Return ONLY valid JSON.\n" +
            "Do not include explanations, markdown, or extra text.\n\n" +
            "{\n" +
            '  "score": "Fresh" | "Consume Soon" | "High Risk",\n' +
            '  "reason": "short explanation"\n' +
            "}\n\n" +
            "Food: " + title + "\n" +
            "Quantity: " + quantity + "\n" +
            "Made at: " + madeAt + "\n" +
            "Expires at: " + expiresAt;

        const raw = await geminiChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return res.json({
                score: "Consume Soon",
                reason: "Food should be consumed soon if stored properly."
            });
        }

        try {
            const parsed = JSON.parse(raw.substring(start, end + 1));
            return res.json(parsed);
        } catch (e) {
            return res.json({
                score: "Consume Soon",
                reason: "Food should be consumed soon if stored properly."
            });
        }

    } catch (err) {
        console.error("Freshness error:", err);
        return res.json({
            score: "Consume Soon",
            reason: "Food safety could not be verified fully."
        });
    }
};

/* -----------------------------
   3) SUGGESTIONS
------------------------------ */
export const suggestions = async function(req, res) {
    try {
        const body = req.body || {};

        const title = body.title || "";
        const type = body.type || "";

        const prompt =
            "Return ONLY valid JSON.\n" +
            "Do not add extra text.\n\n" +
            "{\n" +
            '  "labels": ["label1", "label2"],\n' +
            '  "description": "short natural description"\n' +
            "}\n\n" +
            "Food: " + title + "\n" +
            "Type: " + type;

        const raw = await geminiChat(prompt);

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return res.json({
                labels: ["Fresh Food", "Safe Donation"],
                description: "Freshly prepared food suitable for donation."
            });
        }

        try {
            const parsed = JSON.parse(raw.substring(start, end + 1));
            return res.json(parsed);
        } catch (e) {
            return res.json({
                labels: ["Fresh Food", "Safe Donation"],
                description: "Freshly prepared food suitable for donation."
            });
        }

    } catch (err) {
        console.error("Suggestions error:", err);
        return res.json({
            labels: ["Fresh Food", "Safe Donation"],
            description: "Freshly prepared food suitable for donation."
        });
    }
};