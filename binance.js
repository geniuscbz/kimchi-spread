/**
 * Vercel Serverless Function - Binance API Proxy
 * Endpoint: /api/binance?symbol=BTCUSDT
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

        // Fetch from Binance API
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Binance API returned status ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.price) {
            return res.status(404).json({
                error: 'Not Found',
                message: `Symbol ${symbol} not found on Binance`
            });
        }

        // Return the ticker data
        res.status(200).json(data);

    } catch (error) {
        console.error('Binance API error:', error);

        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}
