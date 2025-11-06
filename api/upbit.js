/**
 * Vercel Serverless Function - Upbit API Proxy
 * Endpoint: /api/upbit?symbol=KRW-BTC
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { symbol } = req.query;

        if (!symbol) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required parameter: symbol'
            });
        }

        // Fetch from Upbit API
        const url = `https://api.upbit.com/v1/ticker?markets=${symbol}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Upbit API returned status ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: `Symbol ${symbol} not found on Upbit`
            });
        }

        // Return the first ticker
        res.status(200).json(data[0]);

    } catch (error) {
        console.error('Upbit API error:', error);

        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}
