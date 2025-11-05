export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({ error: 'chatId and message required' });
  }

  // 환경 변수에서 텔레그램 봇 토큰 가져오기
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return res.status(500).json({ error: 'Telegram bot not configured' });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.description || 'Telegram API error');
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
    
  } catch (error) {
    console.error('Telegram API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```
