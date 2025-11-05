export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Upbit에서 BTC/KRW와 BTC/USDT 가격을 가져와 환율 계산
    const [btcKrwResponse, btcUsdtResponse] = await Promise.all([
      fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC'),
      fetch('https://api.upbit.com/v1/ticker?markets=USDT-BTC')
    ]);

    if (!btcKrwResponse.ok || !btcUsdtResponse.ok) {
      throw new Error('Failed to fetch BTC prices from Upbit');
    }

    const btcKrwData = await btcKrwResponse.json();
    const btcUsdtData = await btcUsdtResponse.json();

    const btcKrwPrice = btcKrwData[0]?.trade_price;
    const btcUsdtPrice = btcUsdtData[0]?.trade_price;

    if (!btcKrwPrice || !btcUsdtPrice) {
      throw new Error('Invalid BTC price data');
    }

    // USD/KRW 환율 계산: BTC/KRW ÷ BTC/USDT
    const usdKrwRate = btcKrwPrice / btcUsdtPrice;

    return res.status(200).json({
      rates: {
        KRW: usdKrwRate
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Exchange Rate API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
