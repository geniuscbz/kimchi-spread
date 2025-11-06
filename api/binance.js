/**
 * Vercel Serverless Function - Binance API Proxy
 * Endpoint: /api/binance?symbol=BTCUSDT
 */

export const config = { runtime: 'edge', regions: ['hnd1'] };

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra }
  });
}

export default async (req) => {
  if (req.method === 'OPTIONS') return json({}, 204);
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'BTCUSDT').toUpperCase();

  const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });

  if (!r.ok) return json({ error: 'BINANCE_UPSTREAM_ERROR', status: r.status }, 502);

  const data = await r.json();
  const price = parseFloat(data.price);
  if (!price) return json({ error: 'INVALID_BINANCE_RESPONSE' }, 502);

  return json({ symbol, price, timestamp: Date.now() });
};