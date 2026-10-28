// Vercel serverless function: receives a lead from the site and forwards it to Telegram.
// Required environment variables (Vercel → Project → Settings → Environment Variables):
//   TG_BOT_TOKEN — bot token from @BotFather
//   TG_CHAT_ID   — chat id that receives leads (your account, a group or a channel)

const MAX = { name: 60, phone: 30, text: 1000, services: 30 };

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const clip = (s, n) => String(s ?? '').trim().slice(0, n);
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100000) : 0;
};
const fmt = (n) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n);

function buildMessage(d) {
  const lines = [];
  lines.push(d.type === 'callback' ? '📞 <b>Обратный звонок</b>' : '🎨 <b>Заявка из калькулятора</b>');
  lines.push('');
  lines.push(`<b>Имя:</b> ${esc(clip(d.name, MAX.name))}`);
  const phone = clip(d.phone, MAX.phone);
  const tel = phone.replace(/[^\d+]/g, '');
  lines.push(`<b>Телефон:</b> <a href="tel:${esc(tel)}">${esc(phone)}</a>`);
  if (d.contact) lines.push(`<b>Связь:</b> ${esc(clip(d.contact, 30))}, ${esc(clip(d.time, 40))}`);

  if (d.type !== 'callback') {
    lines.push('');
    lines.push(`<b>Объект:</b> ${esc(clip(d.object, 40))} (${esc(clip(d.condition, 40))})`);
    lines.push(`<b>Где:</b> ${esc(clip(d.city, 80))}`);
    const services = Array.isArray(d.services) ? d.services.slice(0, MAX.services) : [];
    if (services.length) {
      lines.push('');
      lines.push('<b>Работы:</b>');
      services.forEach((s) => {
        const qty = num(s.qty);
        const unit = clip(s.unit, 10);
        const opts = s.options && typeof s.options === 'object'
          ? Object.entries(s.options).slice(0, 5).map(([k, v]) => `${esc(clip(k, 20))}: ${esc(clip(v, 30))}`).join(', ')
          : '';
        lines.push(`• ${esc(clip(s.name, 60))} — ${qty ? `${fmt(qty)} ${esc(unit)}` : 'объём уточнить'}${opts ? ` <i>(${opts})</i>` : ''}`);
      });
      const area = num(d.totalArea);
      if (area) lines.push(`<b>Итого площадь:</b> ${fmt(area)} м²`);
    }
    lines.push('');
    if (d.materials) lines.push(`<b>Материалы:</b> ${esc(clip(d.materials, 40))}`);
    if (d.timing) lines.push(`<b>Сроки:</b> ${esc(clip(d.timing, 40))}`);
    if (d.comment) lines.push(`<b>Комментарий:</b> ${esc(clip(d.comment, MAX.text))}`);
  }
  return lines.join('\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Telegram is not configured' });
  }

  let d = req.body;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (e) { d = null; }
  }
  if (!d || typeof d !== 'object') return res.status(400).json({ ok: false, error: 'Bad request' });

  // Honeypot: bots fill the hidden field. Pretend success so they don't retry.
  if (d.website) return res.status(200).json({ ok: true });

  const name = clip(d.name, MAX.name);
  const digits = String(d.phone ?? '').replace(/\D/g, '');
  if (name.length < 2 || digits.length < 10 || digits.length > 12) {
    return res.status(422).json({ ok: false, error: 'Invalid name or phone' });
  }

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(d),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const json = await tg.json().catch(() => ({}));
    if (!tg.ok || !json.ok) {
      console.error('Telegram error', tg.status, json.description);
      return res.status(502).json({ ok: false, error: 'Telegram rejected the message' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram request failed', err);
    return res.status(502).json({ ok: false, error: 'Telegram unavailable' });
  }
};

module.exports.buildMessage = buildMessage;
