// Recognizes common search-engine, AI-crawler and monitoring bots from the
// User-Agent header. Order matters a little (more specific patterns first)
// but every pattern is distinct enough that it rarely matters in practice.
const BOT_PATTERNS = [
  { name: 'Googlebot', re: /Googlebot/i },
  { name: 'Bingbot', re: /bingbot/i },
  { name: 'DuckDuckBot', re: /DuckDuckBot/i },
  { name: 'Yandex', re: /YandexBot/i },
  { name: 'Baidu', re: /Baiduspider/i },
  { name: 'GPTBot', re: /GPTBot/i },
  { name: 'ChatGPT-User', re: /ChatGPT-User/i },
  { name: 'OAI-SearchBot', re: /OAI-SearchBot/i },
  { name: 'ClaudeBot', re: /ClaudeBot|Claude-Web|Claude-User/i },
  { name: 'PerplexityBot', re: /PerplexityBot|Perplexity-User/i },
  { name: 'CCBot', re: /CCBot/i },
  { name: 'Applebot', re: /Applebot/i },
  { name: 'Bytespider', re: /Bytespider/i },
  { name: 'Meta/Facebook', re: /facebookexternalhit|Facebot|meta-externalagent/i },
  { name: 'Twitterbot', re: /Twitterbot/i },
  { name: 'LinkedInBot', re: /LinkedInBot/i },
  { name: 'WhatsApp', re: /WhatsApp/i },
  { name: 'Slackbot', re: /Slackbot/i },
  { name: 'Telegram', re: /TelegramBot/i },
  { name: 'AhrefsBot', re: /AhrefsBot/i },
  { name: 'SemrushBot', re: /SemrushBot/i },
  { name: 'MJ12bot', re: /MJ12bot/i },
  { name: 'DotBot', re: /DotBot/i },
  { name: 'Uptime Monitor', re: /UptimeRobot|Pingdom|StatusCake/i },
  // Generic fallback — anything else that self-identifies as a bot/crawler.
  { name: 'Other Bot', re: /bot|crawler|spider|slurp/i },
];

// Returns the matched bot's display name, or null if the User-Agent looks
// like a regular browser.
function detectBot(userAgent) {
  const ua = userAgent || '';
  if (!ua) return null;
  for (const { name, re } of BOT_PATTERNS) {
    if (re.test(ua)) return name;
  }
  return null;
}

module.exports = { detectBot };
