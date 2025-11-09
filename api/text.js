// api/text.js  (Serverless Function cho Vercel)
export default async function handler(req, res) {
  try {
    // [1] Đọc body JSON
    const body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8') || '{}'));
    });
    const { text, user_prompt } = JSON.parse(body);

    // [2] CORS (an toàn khi gọi từ mọi trang/extension)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // [3] Kiểm tra
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    if (!text) return res.status(400).json({ error: 'text required' });

    // [4] Gọi OpenAI Responses API
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content:
            'Bạn là trợ lý học tập. ' +
            'Nếu câu hỏi là trắc nghiệm có lựa chọn A/B/C/D, HÃY CHỈ TRẢ VỀ duy nhất 1 ký tự A hoặc B hoặc C hoặc D (in hoa). ' +
            'Nếu KHÔNG phải trắc nghiệm, trả về một câu trả lời ngắn gọn chỉ 1 dòng (≤120 ký tự), không xuống dòng, không văn hoa dài.' },
          { role: 'user', content: `${user_prompt || ''}\n\nCâu hỏi:\n${text}` }
        ]
      })
    });

    const data = await r.json();
    let raw = data?.output_text
           || data?.output?.[0]?.content?.[0]?.text
           || '';

    // [5] Chuẩn hóa đầu ra:
    raw = (raw || '').toString().replace(/\s+/g, ' ').trim();

    // Nếu có chữ cái A/B/C/D độc lập, lấy đúng 1 ký tự
    const pick = raw.match(/\b[ABCD]\b/i);
    const result = pick ? pick[0].toUpperCase()
                        : raw.slice(0, 120); // 1 dòng ngắn

    return res.status(200).json({ text: result });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
