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
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Binance API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
