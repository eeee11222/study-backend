const r = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    input: [
      { role: 'system', content: 'Bạn là trợ lý học tập. Nếu câu hỏi là trắc nghiệm có lựa chọn A/B/C/D, chỉ trả A/B/C/D; nếu không, trả 1 dòng.' },
      { role: 'user', content: `${user_prompt || ''}\n\nCâu hỏi:\n${text}` }
    ]
  })
});
