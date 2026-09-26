import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

// static files सर्व करने के लिए (public folder)
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_INSTRUCTION = `You are Aivora, a helpful, intelligent, modern, general-purpose AI assistant. Provide accurate, well-structured answers using Markdown. Keep responses clear, concise, and helpful.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'Valid message content is required.' });
        }

        const formattedHistory = [
            { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] },
            { role: 'model', parts: [{ text: "Understood. I am Aivora, your AI assistant." }] }
        ];

        if (Array.isArray(history)) {
            history.forEach(msg => {
                formattedHistory.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });
        }

        formattedHistory.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formattedHistory
        });

        const replyText = response.text || 'I could not generate a response. Please try again.';
        return res.json({ reply: replyText });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
});

// किसी भी पेज रिक्वेस्ट पर index.html दिखाएं
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Aivora backend running securely on port ${PORT}`);
});