export default async function handler(req, res) {
  try {
    // Cho phép CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Đọc body
    const body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8') || '{}'));
    });
    const { text, user_prompt } = JSON.parse(body);

    if (!process.env.OPENAI_API_KEY)
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    if (!text) return res.status(400).json({ error: 'text required' });

    // Gọi OpenAI API
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý học tập. ' +
              'Nếu câu hỏi là trắc nghiệm có lựa chọn A/B/C/D, chỉ trả về duy nhất 1 ký tự A, B, C hoặc D (in hoa). ' +
              'Nếu KHÔNG phải trắc nghiệm, trả về một câu trả lời ngắn gọn 1 dòng (≤120 ký tự).'
          },
          { role: 'user', content: `${user_prompt || ''}\n\nCâu hỏi:\n${text}` }
        ]
      })
    });

    const data = await r.json();
    let raw =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      '';
    raw = (raw || '').replace(/\s+/g, ' ').trim();

    const match = raw.match(/\b[ABCD]\b/i);
    const result = match ? match[0].toUpperCase() : raw.slice(0, 120);
    return res.status(200).json({ text: result });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
