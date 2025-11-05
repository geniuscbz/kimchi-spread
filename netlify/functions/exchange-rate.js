/**
 * Netlify Serverless Function - Exchange Rate (Upbit BTC/KRW ÷ BTC/USDT)
 * Endpoint: /.netlify/functions/exchange-rate
 *
 * Calculates real-time USD/KRW exchange rate using Upbit BTC prices
 * Formula: BTC/KRW ÷ BTC/USDT = USD/KRW
 */

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
        // Fetch both BTC/KRW and BTC/USDT from Upbit
        const [btcKrwResponse, btcUsdtResponse] = await Promise.all([
            fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
                headers: { 'Accept': 'application/json' }
            }),
            fetch('https://api.upbit.com/v1/ticker?markets=USDT-BTC', {
                headers: { 'Accept': 'application/json' }
            })
        ]);

        if (!btcKrwResponse.ok) {
            throw new Error('Upbit BTC/KRW API error: ' + btcKrwResponse.status);
        }

        if (!btcUsdtResponse.ok) {
            throw new Error('Upbit BTC/USDT API error: ' + btcUsdtResponse.status);
        }

        const btcKrwData = await btcKrwResponse.json();
        const btcUsdtData = await btcUsdtResponse.json();

        // Extract prices
        // Upbit returns array: [{ market: "KRW-BTC", trade_price: 50000000, ... }]
        const btcKrwPrice = btcKrwData[0]?.trade_price;
        const btcUsdtPrice = btcUsdtData[0]?.trade_price;

        if (!btcKrwPrice || !btcUsdtPrice || btcKrwPrice <= 0 || btcUsdtPrice <= 0) {
            throw new Error('Invalid BTC prices from Upbit');
        }

        // Calculate exchange rate: BTC/KRW ÷ BTC/USDT = USDT/KRW (= USD/KRW)
        const usdKrwRate = btcKrwPrice / btcUsdtPrice;

        if (!usdKrwRate || usdKrwRate <= 0 || isNaN(usdKrwRate)) {
            throw new Error('Invalid calculated exchange rate');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
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
            })
        };

    } catch (error) {
        console.error('Exchange rate error:', error);

        // Fallback to default rate
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.message,
                source: 'Fallback',
                rates: {
                    USD: 1,
                    KRW: 1300
                }
            })
        };
    }
};
