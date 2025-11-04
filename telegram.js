/**
 * Vercel Serverless Function - Telegram Bot API
 * Endpoint: POST /api/telegram
 *
 * Environment Variables Required:
 * - TELEGRAM_BOT_TOKEN: Your Telegram Bot Token from @BotFather
 *
 * Setup Instructions:
 * 1. Create a bot with @BotFather on Telegram
 * 2. Copy the bot token
 * 3. In Vercel: Settings > Environment Variables
 * 4. Add: TELEGRAM_BOT_TOKEN = your_bot_token_here
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
            console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'Telegram bot is not configured. Please set TELEGRAM_BOT_TOKEN environment variable.'
            });
        }

        // Send message via Telegram Bot API
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
}
