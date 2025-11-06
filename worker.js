/**
 * Cloudflare Worker - 김치스프레드 API
 * Handles all API routes and serves static content
 */

// Import static HTML content (will be inlined during build)
import indexHtml from './index.html';

/**
 * Main request handler
 */
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers for all API responses
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: corsHeaders
            });
        }

        try {
            // Route: /api/upbit
            if (path === '/api/upbit') {
                return handleUpbit(request, corsHeaders);
            }

            // Route: /api/binance
            if (path === '/api/binance') {
                return handleBinance(request, corsHeaders);
            }

            // Route: /api/exchange-rate
            if (path === '/api/exchange-rate') {
                return handleExchangeRate(request, corsHeaders);
            }

            // Route: /api/telegram
            if (path === '/api/telegram') {
                return handleTelegram(request, env, corsHeaders);
            }

            // Route: /health
            if (path === '/health') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    service: '김치스프레드',
                    timestamp: new Date().toISOString(),
                    worker: true
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Default: Serve index.html
            return new Response(indexHtml, {
                headers: {
                    'Content-Type': 'text/html;charset=UTF-8',
                    'Cache-Control': 'public, max-age=300'
                }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }
};

/**
 * Upbit API Handler
 */
async function handleUpbit(request, corsHeaders) {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    if (!symbol) {
        return new Response(JSON.stringify({
            error: 'Bad Request',
            message: 'Missing required parameter: symbol'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
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
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify(data[0]), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Upbit API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Binance API Handler
 */
async function handleBinance(request, corsHeaders) {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    if (!symbol) {
        return new Response(JSON.stringify({
            error: 'Bad Request',
            message: 'Missing required parameter: symbol'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
        const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        const response = await fetch(binanceUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Binance API returned status ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.price) {
            return new Response(JSON.stringify({
                error: 'Not Found',
                message: `Symbol ${symbol} not found on Binance`
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Binance API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Exchange Rate Handler (Upbit BTC/KRW ÷ BTC/USDT)
 */
async function handleExchangeRate(request, corsHeaders) {
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
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Telegram Handler
 */
async function handleTelegram(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
        const body = await request.json();
        const { chatId, message } = body;

        if (!chatId || !message) {
            return new Response(JSON.stringify({
                error: 'Bad Request',
                message: 'Missing required parameters: chatId and message'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const botToken = env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            return new Response(JSON.stringify({
                error: 'Configuration Error',
                message: 'Telegram bot is not configured.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Telegram API error: ${errorData.description || response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Telegram API returned error: ${data.description}`);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Telegram message sent successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Telegram API error:', error);

        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
