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

export const config = { runtime: 'edge', regions: ['hnd1'] };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
  });
}

export default async (req) => {
  if (req.method === 'OPTIONS') return json({}, 204);
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const { chatId, message } = await req.json();
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !chatId || !message) return json({ ok: false, skipped: true });

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });

  const data = await r.json();
  return json({ ok: true, telegram: data });
};