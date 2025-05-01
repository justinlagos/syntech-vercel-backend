import { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { topics } = req.body;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({ error: 'Invalid topics provided.' });
  }

  try {
    const prompt = `Create 7 distinct social media posts (headline + subheadline) for Syntech Biofuel based on the topics: ${topics.join(
      ", "
    )}. Each post must be clear, professional, and suitable for LinkedIn or Instagram.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
    });

    const message = completion.data.choices[0].message?.content;
    res.status(200).json({ result: message });
  } catch (err) {
    res.status(500).json({ error: 'OpenAI API call failed.' });
  }
}