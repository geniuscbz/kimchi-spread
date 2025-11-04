/**
 * ============================================================================
 * 🌶️ 김치스프레드 - Local Development Server
 * ============================================================================
 *
 * This Express server acts as a CORS proxy for exchange APIs and Telegram Bot.
 * Use this for local development only.
 *
 * Usage:
 *   npm install
 *   TELEGRAM_BOT_TOKEN=your_token_here node server.js
 *
 * Endpoints:
 *   GET  /api/upbit?symbol=KRW-BTC
 *   GET  /api/binance?symbol=BTCUSDT
 *   POST /api/telegram (body: {chatId, message})
 *   GET  /health
 *
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');

// Dynamic import for node-fetch (ESM module)
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    cacheTimeout: 500,        // Cache responses for 500ms
    requestTimeout: 10000,    // 10 second timeout
    rateLimit: {
        windowMs: 60000,      // 1 minute window
        maxRequests: 100      // Max 100 req/min per IP
    }
};

// Simple in-memory cache
const cache = new Map();

// Rate limiting tracker
const rateLimiter = new Map();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Rate limiting middleware
function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimiter.has(ip)) {
        rateLimiter.set(ip, []);
    }

    const requests = rateLimiter.get(ip);
    const validRequests = requests.filter(time => now - time < CONFIG.rateLimit.windowMs);
    rateLimiter.set(ip, validRequests);

    if (validRequests.length >= CONFIG.rateLimit.maxRequests) {
        return res.status(429).json({
            error: 'Too many requests',
            message: `Rate limit exceeded. Max ${CONFIG.rateLimit.maxRequests} requests per minute.`
        });
    }

    validRequests.push(now);
    rateLimiter.set(ip, validRequests);
    next();
}

app.use('/api', rateLimit);

// ============================================================================
// CACHE HELPERS
// ============================================================================

function getCached(key) {
    const cached = cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;

    if (age > CONFIG.cacheTimeout) {
        cache.delete(key);
        return null;
    }

    return data;
}

function setCached(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });

    if (cache.size > 1000) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Upbit API Proxy
 * GET /api/upbit?symbol=KRW-BTC
 */
app.get('/api/upbit', async (req, res) => {
    try {
        const symbol = req.query.symbol;

        if (!symbol) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required parameter: symbol'
            });
        }

        // Check cache
        const cacheKey = `upbit:${symbol}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log(`✅ Cache hit: ${cacheKey}`);
            return res.json(cached);
        }

        // Fetch from Upbit API
        const url = `https://api.upbit.com/v1/ticker?markets=${symbol}`;
        console.log(`Fetching: ${url}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.requestTimeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeout);

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

        // Cache and return
        const ticker = data[0];
        setCached(cacheKey, ticker);
        res.json(ticker);

    } catch (error) {
        console.error('Upbit API error:', error);

        if (error.name === 'AbortError') {
            return res.status(504).json({
                error: 'Gateway Timeout',
                message: 'Request to Upbit API timed out'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * Binance API Proxy
 * GET /api/binance?symbol=BTCUSDT
 */
app.get('/api/binance', async (req, res) => {
    try {
        const symbol = req.query.symbol;

        if (!symbol) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required parameter: symbol'
            });
        }

        // Check cache
        const cacheKey = `binance:${symbol}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log(`✅ Cache hit: ${cacheKey}`);
            return res.json(cached);
        }

        // Fetch from Binance API
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        console.log(`Fetching: ${url}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.requestTimeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeout);

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

        // Cache and return
        setCached(cacheKey, data);
        res.json(data);

    } catch (error) {
        console.error('Binance API error:', error);

        if (error.name === 'AbortError') {
            return res.status(504).json({
                error: 'Gateway Timeout',
                message: 'Request to Binance API timed out'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * Telegram Bot API
 * POST /api/telegram
 * Body: { chatId: "123456789", message: "text" }
 */
app.post('/api/telegram', async (req, res) => {
    try {
        const { chatId, message } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required parameters: chatId and message'
            });
        }

        // Get bot token from environment variable
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            console.error('⚠️ TELEGRAM_BOT_TOKEN environment variable is not set');
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN environment variable.'
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

        console.log(`✅ Telegram message sent to ${chatId}`);

        res.status(200).json({
            success: true,
            message: 'Telegram message sent successfully'
        });

    } catch (error) {
        console.error('Telegram API error:', error);

        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: '김치스프레드',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        cacheSize: cache.size,
        activeIPs: rateLimiter.size,
        telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN
    });
});

/**
 * Root endpoint - API documentation
 * GET /
 */
app.get('/', (req, res) => {
    res.json({
        name: '🌶️ 김치스프레드 - Local Development Server',
        version: '2.0.0',
        description: 'Upbit ↔ Binance Premium Tracker with Telegram Alerts',
        endpoints: {
            '/api/upbit': {
                method: 'GET',
                params: { symbol: 'KRW-BTC (Upbit market code)' },
                example: '/api/upbit?symbol=KRW-BTC'
            },
            '/api/binance': {
                method: 'GET',
                params: { symbol: 'BTCUSDT (Binance pair code)' },
                example: '/api/binance?symbol=BTCUSDT'
            },
            '/api/telegram': {
                method: 'POST',
                body: { chatId: 'string', message: 'string' },
                example: 'POST /api/telegram with JSON body'
            },
            '/health': {
                method: 'GET',
                description: 'Health check and server stats'
            }
        },
        features: [
            'CORS enabled',
            'Response caching (500ms)',
            'Rate limiting (100 req/min per IP)',
            'Request timeout (10s)',
            'Telegram bot integration',
            'Real-time USD/KRW exchange rate',
            'Premium alert system'
        ],
        setup: {
            telegram: 'Set TELEGRAM_BOT_TOKEN environment variable'
        }
    });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableRoutes: ['/api/upbit', '/api/binance', '/api/telegram', '/health', '/']
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
    // Wait for fetch to be loaded
    let attempts = 0;
    while (!fetch && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!fetch) {
        console.error('❌ Failed to load node-fetch module');
        process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
        console.log('');
        console.log('========================================');
        console.log('🌶️ 김치스프레드 Server Started');
        console.log('========================================');
        console.log(`📡 Server: http://localhost:${PORT}`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`⏱️  Cache timeout: ${CONFIG.cacheTimeout}ms`);
        console.log(`🛡️  Rate limit: ${CONFIG.rateLimit.maxRequests} req/min per IP`);
        console.log(`📱 Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
        console.log('');
        console.log('Available endpoints:');
        console.log(`  GET  http://localhost:${PORT}/api/upbit?symbol=KRW-BTC`);
        console.log(`  GET  http://localhost:${PORT}/api/binance?symbol=BTCUSDT`);
        console.log(`  POST http://localhost:${PORT}/api/telegram`);
        console.log(`  GET  http://localhost:${PORT}/health`);
        console.log('');
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.log('⚠️  Set TELEGRAM_BOT_TOKEN environment variable for Telegram alerts');
            console.log('   Example: TELEGRAM_BOT_TOKEN=your_token node server.js');
            console.log('');
        }
        console.log('💡 Open index.html and enable "Use Proxy Server"');
        console.log('========================================');
        console.log('');
    });
}

// Start the server
startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
