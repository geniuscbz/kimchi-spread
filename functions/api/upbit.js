/**
 * Cloudflare Pages Function - Upbit API Proxy
 * Endpoint: /api/upbit?symbol=KRW-BTC
 */

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

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
        const symbol = url.searchParams.get('symbol');

        if (!symbol) {
            return new Response(JSON.stringify({
                error: 'Bad Request',
                message: 'Missing required parameter: symbol'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch from Upbit API
        const upbitUrl = `https://api.upbit.com/v1/ticker?markets=${symbol}`;
        const response = await fetch(upbitUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Upbit API returned status ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return new Response(JSON.stringify({
                error: 'Not Found',
                message: `Symbol ${symbol} not found on Upbit`
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Return the first ticker
        return new Response(JSON.stringify(data[0]), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Upbit API error:', error);

        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
