import fetch from "node-fetch";

const GEMINI_ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// ✅ CLEAN HELPER (NO MARKDOWN, NO AUTOFORMAT ISSUES)
function cleanText(text) {
    if (!text) return "";
    return text
        .replace(/[#*`>|_-]/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

export async function geminiChat(prompt) {
    try {
        const response = await fetch(
            GEMINI_ENDPOINT + "?key=" + process.env.GEMINI_API_KEY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        const data = await response.json();

        // 🔎 Debug log (KEEP for hackathon)
        console.log("GEMINI RAW RESPONSE:", JSON.stringify(data));

        if (!data ||
            !data.candidates ||
            data.candidates.length === 0 ||
            !data.candidates[0].content ||
            !data.candidates[0].content.parts
        ) {
            return "";
        }

        let text = "";

        for (let i = 0; i < data.candidates[0].content.parts.length; i++) {
            const part = data.candidates[0].content.parts[i];
            if (part.text) {
                text += part.text + " ";
            }
        }

        // ✅ APPLY CLEANING HERE
        return cleanText(text);

    } catch (err) {
        console.error("Gemini API error:", err);
        return "";
    }
}