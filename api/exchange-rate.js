/**
 * Vercel Serverless Function - Exchange Rate (Upbit BTC/KRW ÷ BTC/USDT)
 * Endpoint: /api/exchange-rate
 *
 * Calculates real-time USD/KRW exchange rate using Upbit BTC prices
 * Formula: BTC/KRW ÷ BTC/USDT = USD/KRW
 */

export const config = { runtime: 'edge', regions: ['hnd1'] };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
  });
}

export default async (req) => {
  if (req.method === 'OPTIONS') return json({}, 204);

  const [upKrw, biUsd] = await Promise.all([
    fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', { cache: 'no-store' }).then(r => r.json()),
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store' }).then(r => r.json())
  ]);

  const btcKrw = upKrw?.[0]?.trade_price;
  const btcUsdt = parseFloat(biUsd?.price);

  if (!btcKrw || !btcUsdt) return json({ error: 'EXRATE_UPSTREAM_ERROR' }, 502);

  const usdKrw = btcKrw / btcUsdt; // USD/KRW
  return json({ rates: { KRW: usdKrw }, ts: Date.now() });
};
