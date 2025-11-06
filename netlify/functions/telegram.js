/**
 * Netlify Serverless Function - Telegram Bot API
 * Endpoint: POST /.netlify/functions/telegram
 *
 * Environment Variables Required:
 * - TELEGRAM_BOT_TOKEN: Your Telegram Bot Token from @BotFather
 *
 * Setup Instructions:
 * 1. Create a bot with @BotFather on Telegram
 * 2. Copy the bot token
 * 3. In Netlify: Site settings > Environment variables
 * 4. Add: TELEGRAM_BOT_TOKEN = your_bot_token_here
 */

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { chatId, message } = JSON.parse(event.body || '{}');

        if (!chatId || !message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Missing required parameters: chatId and message'
                })
            };
        }

        // Get bot token from environment variable
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Configuration Error',
                    message: 'Telegram bot is not configured. Please set TELEGRAM_BOT_TOKEN environment variable.'
                })
            };
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Telegram message sent successfully'
            })
        };

    } catch (error) {
        console.error('Telegram API error:', error);

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
