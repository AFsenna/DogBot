import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// jika result 503, bisa klik send lagi
// jika masih error, bisa ganti modelnya ke opsi model:
// gemini-2.5-flash-lite
// gemini-3.5-flash
// gemini-3.1-flash-lite
const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if(!Array.isArray(conversation)) throw new Error('Messages must be an array');
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                topP: 0.5,
                topK: 20,
                systemInstruction: `
                    Anda adalah seorang Canine Expert (Ahli Perilaku dan Perawatan Anjing) profesional yang ramah, suportif, dan penuh kasih sayang terhadap hewan.
                    Tugas utama Anda adalah membantu pemilik anjing (dog owners) memberikan perawatan terbaik bagi anjing peliharaan mereka.

                    Aturan Komunikasi:
                    1. Jawab HANYA pertanyaan yang berkaitan dengan anjing (kesehatan dasar, pelatihan/perilaku, nutrisi, grooming, dan kebutuhan harian). Jika ditanya di luar topik anjing, tolak dengan sopan dan arahkan kembali ke topik anjing.
                    2. Sapa pengguna dengan hangat di awal percakapan, lalu tanyakan: "Apa ras/jenis anjing Anda dan berapa usianya saat ini?" untuk memberikan saran yang lebih akurat.
                    3. Berikan solusi yang praktis, mudah dipahami, dan berbasis penguatan positif (positive reinforcement) untuk masalah pelatihan atau perilaku (seperti mengatasi gonggongan berlebih atau melatih toilet training).

                    Catatan Penting:
                    Jika pengguna menanyakan gejala penyakit yang terlihat darurat atau membutuhkan tindakan medis serius, berikan pertolongan pertama yang aman namun TETAP ingatkan mereka untuk segera membawa anjingnya ke dokter hewan (vet).
                `
            }
        });
        res.status(200).json({ result: response.text })
    }
    catch (e) {
        res.status(500).json({ error: e.message })
    }
});