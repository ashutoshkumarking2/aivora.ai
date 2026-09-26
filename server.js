import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Allow requests from any frontend origin
app.use(cors());
app.use(express.json());

// Root test route
app.get('/', (req, res) => {
    res.send('Aivora Backend is running!');
});

// Gemini Client initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Main Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Model name corrected to 'gemini-2.0-flash'
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: message,
        });

        const replyText = response.text;

        // Sending both 'text' and 'reply' so frontend reads it regardless of variable name
        res.json({ 
            reply: replyText, 
            text: replyText 
        });

    } catch (error) {
        console.error("Error in /api/chat:", error);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message 
        });
    }
});

// Port Handling for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
