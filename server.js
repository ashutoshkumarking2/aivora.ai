import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS को इनेबल करें ताकि GitHub Pages से रिकुए्स्ट आ सके
app.use(cors());
app.use(express.json());

// Root test route (ताकि ब्राउज़र में Not Found न दिखे)
app.get('/', (req, res) => {
    res.send('Aivora Backend is running!');
});

// Gemini Client initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Main Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
        });

        res.json({ text: response.text });
    } catch (error) {
        console.error("Error in /api/chat:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Port Handling (Render ऑटोमैटिकली PORT असाइन करता है)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
