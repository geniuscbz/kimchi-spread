/**
 * Netlify Serverless Function - Bithumb API Proxy
 * Endpoint: /.netlify/functions/bithumb?symbol=BTC_KRW
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
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: data.message || 'Bithumb API error'
                })
            };
        }

        // Return the full response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Bithumb API error:', error);

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
