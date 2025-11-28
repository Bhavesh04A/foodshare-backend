// backend/src/config/groq.js
import Groq from "groq-sdk";

function cleanResponse(text) {
    if (!text) return "";
    text = text.replace(/\*\*/g, "");
    text = text.replace(/\*/g, "");
    text = text.replace(/[`#_>-]/g, "");
    text = text.replace(/\n{2,}/g, "\n");
    return text.trim();
}

export async function groqChat(prompt) {
    try {
        const client = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        const result = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "user", content: String(prompt) }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        let reply = "AI response unavailable";

        if (
            result &&
            result.choices &&
            result.choices[0] &&
            result.choices[0].message &&
            result.choices[0].message.content
        ) {
            reply = result.choices[0].message.content;
        }

        // RETURN clean text (no **, no * etc.)
        return cleanResponse(reply);

    } catch (err) {
        console.error("Groq API Error:", err);
        return "AI error";
    }
}