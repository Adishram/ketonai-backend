import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const model = 'gemini-2.5-flash-preview-04-17';
const systemPrompt = `
Make it a really friendly tone with lots of emojis and fun with kids, sassy and cool to teenagers, polite and mature to adults, and extremely friendly and detail-oriented to elders. Recommend keto diets and recipes tailored by age, location, budget, food preference, and Jain/vegan/nonveg types. Recreate local dishes as keto-friendly.
`;

app.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const userMessage = req.body.message;
  if (!userMessage) {
    res.status(400).send({ error: 'No message provided.' });
    return;
  }

  const contents = [
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  try {
    const response = await genAI.models.generateContentStream({
      model,
      config: {
        temperature: 0.7,
        responseMimeType: 'text/plain',
        systemInstruction: [{ text: systemPrompt }],
      },
      contents,
    });

    res.setHeader('Content-Type', 'text/plain');

    for await (const chunk of response) {
      if (chunk.text) res.write(chunk.text);
    }

    res.end();
  } catch (err) {
    console.error('❌ Gemini API Error:', err);
    res.status(500).send({ error: 'Failed to get response from Gemini' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 KetonAI running at http://localhost:${PORT}`);
});
