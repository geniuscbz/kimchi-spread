const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { symbol } = event.queryStringParameters || {};
        
        if (!symbol) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing parameter: symbol' })
            };
        }

        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        const response = await fetch(url);

        if (!response.ok) {
            // ✅ 문법 수정
            throw new Error(`Binance API returned status ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Binance API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
