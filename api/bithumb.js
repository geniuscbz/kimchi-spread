/**
 * Vercel Serverless Function - Bithumb API Proxy
 * Endpoint: /api/bithumb?symbol=BTC_KRW
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

        // Fetch from Bithumb API
        const url = `https://api.bithumb.com/public/ticker/${symbol}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Bithumb API returned status ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== '0000') {
            return res.status(400).json({
                error: 'Bad Request',
                message: data.message || 'Bithumb API error'
            });
        }

        // Return the full response
        res.status(200).json(data);

    } catch (error) {
        console.error('Bithumb API error:', error);

        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}
