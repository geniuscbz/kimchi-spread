/**
 * Cloudflare Pages Function - Exchange Rate (Upbit BTC/KRW ÷ BTC/USDT)
 * Endpoint: /api/exchange-rate
 */

export async function onRequest(context) {
    const { request } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Fetch both BTC/KRW and BTC/USDT from Upbit
        const [btcKrwResponse, btcUsdtResponse] = await Promise.all([
            fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
                headers: { 'Accept': 'application/json' }
            }),
            fetch('https://api.upbit.com/v1/ticker?markets=USDT-BTC', {
                headers: { 'Accept': 'application/json' }
            })
        ]);

        if (!btcKrwResponse.ok || !btcUsdtResponse.ok) {
            throw new Error('Upbit API error');
        }

        const btcKrwData = await btcKrwResponse.json();
        const btcUsdtData = await btcUsdtResponse.json();

        const btcKrwPrice = btcKrwData[0]?.trade_price;
        const btcUsdtPrice = btcUsdtData[0]?.trade_price;

        if (!btcKrwPrice || !btcUsdtPrice || btcKrwPrice <= 0 || btcUsdtPrice <= 0) {
            throw new Error('Invalid BTC prices from Upbit');
        }

        // Calculate exchange rate: BTC/KRW ÷ BTC/USDT = USD/KRW
        const usdKrwRate = btcKrwPrice / btcUsdtPrice;

        const result = {
            source: 'Upbit (BTC/KRW ÷ BTC/USDT)',
            timestamp: new Date().toISOString(),
            rates: {
                USD: 1,
                KRW: usdKrwRate
            },
            debug: {
                btcKrw: btcKrwPrice,
                btcUsdt: btcUsdtPrice,
                calculation: `${btcKrwPrice} ÷ ${btcUsdtPrice} = ${usdKrwRate.toFixed(2)}`
            }
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Exchange rate error:', error);

        return new Response(JSON.stringify({
            error: error.message,
            source: 'Fallback',
            rates: {
                USD: 1,
                KRW: 1300
            }
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
