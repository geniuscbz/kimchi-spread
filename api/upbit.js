export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter required' });
  }

  try {
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Upbit API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 배열에서 첫 번째 항목 반환
    return res.status(200).json(data[0]);
    
  } catch (error) {
    console.error('Upbit API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
