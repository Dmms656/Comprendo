/**
 * Envía un mensaje de texto por la API HTTP de Telegram Bot.
 * @param {string|number} chatId
 * @param {string} text
 */
export async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Falta TELEGRAM_BOT_TOKEN en el entorno.");
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const desc = data?.description || res.statusText;
    throw new Error(`Telegram API: ${desc}`);
  }
  return data;
}
