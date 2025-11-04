/**
 * Netlify Serverless Function - Binance API Proxy
 * Endpoint: /.netlify/functions/binance?symbol=BTCUSDT
 */

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow GET requests
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
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Missing required parameter: symbol'
                })
            };
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
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Not Found',
                    message: `Symbol ${symbol} not found on Binance`
                })
            };
        }

        // Return the ticker data
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
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            })
        };
    }
};
