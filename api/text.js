export default async function handler(req, res) {
  try {
    // Cho phép CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Nhận dữ liệu từ body
    const body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8') || '{}'));
    });
    const { text, user_prompt } = JSON.parse(body);

    if (!process.env.OPENAI_API_KEY)
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    if (!text) return res.status(400).json({ error: 'text required' });

    // 🔥 Gọi API OpenAI
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý học tập. Nếu câu hỏi là trắc nghiệm (A/B/C/D), chỉ trả về 1 ký tự A/B/C/D. Nếu không, trả về 1 câu ngắn gọn 1 dòng.'
          },
          { role: 'user', content: `${user_prompt || ''}\n\n${text}` }
        ],
        temperature: 0.2
      })
    });

    const data = await r.json();

    // ✅ Xử lý kết quả đầu ra
    const answer =
      data?.choices?.[0]?.message?.content?.trim() || '(Không có phản hồi)';
    return res.status(200).json({ text: answer });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
