/**
 * Vercel Serverless Function - Upbit API Proxy
 * Endpoint: /api/upbit?symbol=KRW-BTC
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
  const symbol = searchParams.get('symbol') || 'KRW-BTC';

  const r = await fetch(`https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(symbol)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });

  if (!r.ok) return json({ error: 'UPBIT_UPSTREAM_ERROR', status: r.status }, 502);

  const arr = await r.json();
  const t = arr && arr[0] ? arr[0] : null;
  if (!t || !t.trade_price) return json({ error: 'INVALID_UPBIT_RESPONSE' }, 502);

  return json({ market: symbol, trade_price: t.trade_price, timestamp: t.timestamp });
};
