import { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST requests allowed" });

  const { topics } = req.body;
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({ error: "Invalid topics provided." });
  }

  try {
    const prompt = \`
Generate 7 distinct, premium-quality social media posts for Syntech Biofuel.
Each post should have a:
- Headline (bold, punchy)
- Subheadline (1–2 sentences expanding on the message)
Avoid repeating formats. Include humor tags for any light or cheeky variations.
Use these topics: ${topics.join(", ")}

Return as JSON:
[
  { "headline": "...", "subheadline": "...", "isFunny": true/false },
  ...
]
\`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
    });

    const raw = completion.data.choices[0].message?.content;
    const match = raw?.match(/\[\s*{[\s\S]+}\s*\]/);
    const parsed = match ? JSON.parse(match[0]) : null;

    if (!parsed || !Array.isArray(parsed)) {
      return res.status(500).json({ error: "Failed to parse OpenAI response." });
    }

    res.status(200).json({ result: parsed });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "OpenAI API call failed." });
  }
}  
