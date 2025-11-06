/**
 * Cloudflare Worker - 김치스프레드 API (수정됨)
 * 
 * 변경 사항:
 * - HTML import 제거 (Workers는 HTML 직접 서빙 어려움)
 * - API 엔드포인트만 제공
 * - 프론트엔드는 Cloudflare Pages에 별도 배포 권장
 * 
 * 배포 방법:
 * 1. wrangler.toml의 account_id 설정
 * 2. wrangler deploy
 * 3. 환경 변수 TELEGRAM_BOT_TOKEN 설정
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
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
                    service: '김치스프레드 API',
                    timestamp: new Date().toISOString(),
                    worker: true,
                    note: 'API only - Deploy HTML to Cloudflare Pages'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Default: API 문서
            return new Response(JSON.stringify({
                name: '🌶️ 김치스프레드 API',
                version: '2.0.0',
                message: 'API 전용 Worker입니다. HTML은 Cloudflare Pages에 배포하세요.',
                endpoints: {
                    '/api/upbit': {
                        method: 'GET',
                        params: { symbol: 'KRW-BTC' },
                        description: 'Upbit 가격 조회'
                    },
                    '/api/binance': {
                        method: 'GET',
                        params: { symbol: 'BTCUSDT' },
                        description: 'Binance 가격 조회'
                    },
                    '/api/exchange-rate': {
                        method: 'GET',
                        description: '실시간 환율 (Upbit BTC/KRW ÷ BTC/USDT)'
                    },
                    '/api/telegram': {
                        method: 'POST',
                        body: { chatId: 'string', message: 'string' },
                        description: '텔레그램 알림 전송'
                    },
                    '/health': {
                        method: 'GET',
                        description: '서버 상태 확인'
                    }
                },
                setup: {
                    frontend: 'Deploy index.html to Cloudflare Pages',
                    telegram: 'Set TELEGRAM_BOT_TOKEN environment variable',
                    cors: 'Enabled for all origins'
                },
                links: {
                    pages: 'https://developers.cloudflare.com/pages/',
                    docs: 'https://github.com/your-repo/README.md'
                }
            }, null, 2), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders 
                }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                timestamp: new Date().toISOString()
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
            message: 'Missing required parameter: symbol',
            example: '/api/upbit?symbol=KRW-BTC'
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
                message: `Symbol ${symbol} not found on Upbit`,
                availableMarkets: 'https://api.upbit.com/v1/market/all'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify(data[0]), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=1',
                ...corsHeaders 
            }
        });

    } catch (error) {
        console.error('Upbit API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message,
            service: 'Upbit'
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
            message: 'Missing required parameter: symbol',
            example: '/api/binance?symbol=BTCUSDT'
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
                message: `Symbol ${symbol} not found on Binance`,
                availableSymbols: 'https://api.binance.com/api/v3/exchangeInfo'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=1',
                ...corsHeaders 
            }
        });

    } catch (error) {
        console.error('Binance API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message,
            service: 'Binance'
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
                calculation: `${btcKrwPrice.toLocaleString()} ÷ ${btcUsdtPrice.toLocaleString()} = ${usdKrwRate.toFixed(2)}`
            }
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=2',
                ...corsHeaders 
            }
        });

    } catch (error) {
        console.error('Exchange rate error:', error);

        // Fallback to default rate
        return new Response(JSON.stringify({
            error: error.message,
            source: 'Fallback',
            timestamp: new Date().toISOString(),
            rates: {
                USD: 1,
                KRW: 1300
            },
            note: 'Using default exchange rate due to API error'
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                ...corsHeaders 
            }
        });
    }
}

/**
 * Telegram Handler
 */
async function handleTelegram(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ 
            error: 'Method not allowed',
            allowedMethods: ['POST']
        }), {
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
                message: 'Missing required parameters: chatId and message',
                example: {
                    chatId: '123456789',
                    message: 'Your message here'
                }
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get bot token from environment variable
        const botToken = env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
            return new Response(JSON.stringify({
                error: 'Configuration Error',
                message: 'Telegram bot is not configured. Please set TELEGRAM_BOT_TOKEN environment variable.',
                setup: 'wrangler secret put TELEGRAM_BOT_TOKEN'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Send message via Telegram Bot API
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

        console.log(`✅ Telegram message sent to chat ${chatId}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Telegram message sent successfully',
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Telegram API error:', error);

        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message,
            service: 'Telegram'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
