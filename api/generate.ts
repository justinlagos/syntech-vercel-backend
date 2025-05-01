// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "https://celebrated-cat-db0906.netlify.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { topics } = req.body;
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const prompt = `You are a creative copywriter. Generate 7 unique social media content examples for Syntech Biofuel.
Each content should:
- Be about: ${topics.join(", ")}
- Include a professional headline and a subheadline
- Mention sustainability or innovation subtly
- Be concise and engaging
- Mark humorous ones clearly

Format response as:
[
  {
    "headline": "...",
    "subheadline": "...",
    "isFunny": true/false
  },
  ...
]`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const parsed = JSON.parse(completion.data.choices[0].message?.content || "[]");
    return res.status(200).json({ result: parsed });
  } catch (err: any) {
    console.error("OpenAI Error:", err.response?.data || err.message || err);
    res.status(500).json({
      error: "OpenAI API call failed.",
      details: err.response?.data || err.message || err,
    });
  }
}
