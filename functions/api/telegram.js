/**
 * Cloudflare Pages Function - Telegram Bot API
 * Endpoint: /api/telegram
 * Body: { chatId: "123456789", message: "text" }
 */

export async function onRequest(context) {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
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
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get bot token from environment variable
        const botToken = env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            console.error('⚠️ TELEGRAM_BOT_TOKEN environment variable is not set');
            return new Response(JSON.stringify({
                error: 'Configuration Error',
                message: 'Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN environment variable.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
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

        return new Response(JSON.stringify({
            success: true,
            message: 'Telegram message sent successfully'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Telegram API error:', error);

        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
