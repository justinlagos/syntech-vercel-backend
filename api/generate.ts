import { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "https://celebrated-cat-db0906.netlify.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST requests allowed" });

  const { topics } = req.body;
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({ error: "Invalid topics provided." });
  }

  try {
    const prompt = `
Generate 7 social media posts for Syntech Biofuel.
Each post must include:
- headline (short and catchy)
- subheadline (1–2 lines expanding the idea)
Return as a JSON array like:
[
  { "headline": "...", "subheadline": "...", "isFunny": true/false },
  ...
]
Topics: ${topics.join(", ")}
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = completion.data.choices[0].message?.content || "";

    // Attempt to extract valid JSON
    const match = content.match(/\[\s*{[\s\S]+}\s*\]/);
    const parsed = match ? JSON.parse(match[0]) : null;

    if (parsed && Array.isArray(parsed)) {
      return res.status(200).json({ result: parsed });
    }

    // fallback: parse basic numbered list
    const fallback = content
      .split(/\n(?=\d+\.)/)
      .filter(Boolean)
      .map((entry) => {
        const [headline, ...rest] = entry.trim().split("\n");
        return {
          headline: headline.replace(/^\d+\.\s*/, "").trim(),
          subheadline: rest.join(" ").trim(),
        };
      });

    if (!fallback.length) throw new Error("No usable output");

    res.status(200).json({ result: fallback });
} catch (err: any) {
  console.error("OpenAI Error:", err.response?.data || err.message || err);
  res.status(500).json({
    error: "OpenAI API call failed.",
    details: err.response?.data || err.message || err,
  });
}

}
