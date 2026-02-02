const Groq = require("groq-sdk");
const asyncHandler = require("express-async-handler");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

//@description     Get AI response from Groq
//@route           POST /api/ai/chat
//@access          Protected
const getAiResponse = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!process.env.GROQ_API_KEY) {
        res.status(500);
        throw new Error("Groq API Key is missing. Please add it to your .env file.");
    }

    if (!message) {
        res.status(400);
        throw new Error("Please provide a message");
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are Xerah, a helpful and friendly AI assistant integrated into a chat application. Your responses should be concise, helpful, and personable.",
                },
                {
                    role: "user",
                    content: message,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
        });

        res.json({
            response: chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
        });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(error.status || 500);
        throw new Error(error.message || "An error occurred while fetching AI response.");
    }
});

module.exports = { getAiResponse };
