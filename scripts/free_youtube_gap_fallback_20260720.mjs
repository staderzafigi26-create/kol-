import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const API_BASE = process.env.LOCAL_API_BASE || 'http://127.0.0.1:3000';
const QUEUE_FILE = path.join(ROOT, 'data', 'reports', 'month-gap-retry-20260720', '高置信漏抓补拉队列.csv');
const REPORT_DIR = path.join(ROOT, 'data', 'reports', 'month-gap-retry-20260720');
const PUBLISHED_AFTER = Date.parse('2026-07-12T16:00:00.000Z');
const KEYWORD_RE = /yozma|yozmasport|in\s*[-_]?\s*10/i;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = (rows.shift() || []).map((value) => value.replace(/^\uFEFF/, '').trim());
  return rows.filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, String(values[index] || '').trim()]))
  );
}

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pick(block, pattern) {
  return decodeXml(block.match(pattern)?.[1] || '').trim();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function parseFeed(xml, target) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const block = match[1];
    const id = pick(block, /<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = pick(block, /<title>([\s\S]*?)<\/title>/);
    const description = pick(block, /<media:description>([\s\S]*?)<\/media:description>/);
    const timestamp = pick(block, /<published>([^<]+)<\/published>/);
    const views = Number(block.match(/<media:statistics[^>]*views="(\d+)"/)?.[1] || 0);
    return {
      url: `https://www.youtube.com/shorts/${id}`,
      platform: 'youtubeshort',
      creator: target['红人名称'],
      timestamp,
      caption: `${title}\n${description}`.trim(),
      videoViewCount: views,
      videoPlayCount: views,
      monitor: '是'
    };
  }).filter((row) => row.url && Date.parse(row.timestamp) >= PUBLISHED_AFTER && KEYWORD_RE.test(row.caption));
}

const targets = parseCsv(await fs.readFile(QUEUE_FILE, 'utf8')).filter((row) => row['平台'] === 'youtubeshort');
const report = [];
const importRows = [];
for (const target of targets) {
  try {
    const html = await fetchText(target['红人主页链接']);
    const channelId = html.match(/"browseId":"(UC[A-Za-z0-9_-]{22})"/)?.[1]
      || html.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})/)?.[1];
    if (!channelId) throw new Error('未解析到频道ID');
    const feed = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const matched = parseFeed(feed, target);
    importRows.push(...matched);
    report.push({ creator: target['红人名称'], profileUrl: target['红人主页链接'], channelId, status: 'success', matched: matched.length, error: '' });
  } catch (error) {
    report.push({ creator: target['红人名称'], profileUrl: target['红人主页链接'], channelId: '', status: 'failed', matched: 0, error: error.message });
  }
}

const response = await fetch(`${API_BASE}/api/local/videos/import`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ rows: importRows })
});
const imported = await response.json().catch(() => ({}));
if (!response.ok || !imported.ok) throw new Error(imported.error || `导入失败 HTTP ${response.status}`);
await fs.writeFile(path.join(REPORT_DIR, '免费YouTube补拉明细.json'), `${JSON.stringify({ report, candidates: importRows, imported }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ targets: targets.length, checked: report.filter((row) => row.status === 'success').length, failed: report.filter((row) => row.status === 'failed').length, matched: importRows.length, imported }, null, 2));
