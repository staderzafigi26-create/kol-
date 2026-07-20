import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const RUNTIME_ROOT = process.env.TRACKER_RUNTIME_ROOT
  || '/Users/ryan/Documents/项目编程/runtime/红人数据检测追踪工具';
const LOCAL_DIR = path.join(RUNTIME_ROOT, 'data', 'local');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reports', 'month-gap-retry-20260720');
const CRM_TARGETS_PATH = process.env.YOZMA_CRM_VIDEO_TARGETS
  || '/Users/ryan/Library/Application Support/Yozma KOL CRM/state/video-monitor-targets.json';

function fields(row) {
  return row?.fields || row || {};
}

function text(value) {
  if (value && typeof value === 'object') return String(value.text || value.name || value.value || value.link || '').trim();
  return String(value || '').trim();
}

function link(value) {
  if (value && typeof value === 'object') return String(value.link || value.url || value.text || '').trim();
  return String(value || '').trim();
}

function normalizeName(value) {
  return text(value).toLowerCase().replace(/^@/, '').replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
}

function normalizeUrl(value) {
  const raw = link(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    url.hash = '';
    url.search = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().toLowerCase();
  } catch {
    return raw.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
  }
}

function normalizePlatform(value, url = '') {
  const raw = `${text(value)} ${url}`.toLowerCase();
  if (raw.includes('instagram')) return 'instagramreels';
  if (raw.includes('tiktok')) return 'tiktok';
  if (raw.includes('short')) return 'youtubeshort';
  if (raw.includes('youtube') || raw.includes('youtu.be')) return 'youtubevideo';
  return '';
}

function monitorEnabled(value) {
  return ['是', 'yes', 'true', '1', '监控中', '需要监控'].includes(text(value).toLowerCase());
}

function monthOf(value) {
  const timestamp = Date.parse(text(value));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 7) : '';
}

function csvEscape(value) {
  const output = value == null ? '' : String(value);
  return /[",\n\r]/.test(output) ? `"${output.replace(/"/g, '""')}"` : output;
}

async function writeCsv(filePath, rows) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [headers.join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))];
  await fs.writeFile(filePath, `\uFEFF${lines.join('\n')}\n`, 'utf8');
}

const [influencers, videos, ledger, crmTargets] = await Promise.all([
  fs.readFile(path.join(LOCAL_DIR, 'influencers.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(LOCAL_DIR, 'videos.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(LOCAL_DIR, 'apify-budget-ledger.json'), 'utf8').then(JSON.parse),
  fs.readFile(CRM_TARGETS_PATH, 'utf8').then(JSON.parse)
]);

const juneCreators = new Set();
const julyCreators = new Set();
for (const row of videos) {
  const f = fields(row);
  const name = normalizeName(f['红人名称']);
  if (!name) continue;
  const month = monthOf(f.timestamp || f['发布时间'] || f.publishedAt);
  if (month === '2026-06') juneCreators.add(name);
  if (month === '2026-07') julyCreators.add(name);
}

const crmNames = new Set();
const crmUrls = new Set();
for (const row of crmTargets.rows || []) {
  const name = normalizeName(row.name);
  if (name) crmNames.add(name);
  for (const value of row.profileUrls || []) {
    const url = normalizeUrl(value);
    if (url) crmUrls.add(url);
  }
}

const scannedToday = new Set();
for (const entry of ledger.entries || []) {
  if (String(entry.settledAt || '') < '2026-07-20T00:00:00.000Z') continue;
  const url = normalizeUrl(entry.meta?.influencerInput);
  if (url && entry.meta?.actorRunId) scannedToday.add(url);
}

const candidates = [];
const seen = new Set();
for (const row of influencers) {
  const f = fields(row);
  if (!monitorEnabled(f['是否监控'])) continue;
  const creatorKey = normalizeName(f['红人名称']);
  const profileUrl = link(f['红人链接']);
  const urlKey = normalizeUrl(profileUrl);
  const platform = normalizePlatform(f['平台'], profileUrl);
  if (!creatorKey || !profileUrl || !platform || !juneCreators.has(creatorKey) || julyCreators.has(creatorKey)) continue;
  if (crmNames.has(creatorKey) || crmUrls.has(urlKey)) continue;
  if (scannedToday.has(urlKey)) continue;
  const dedupeKey = `${platform}__${urlKey}`;
  if (seen.has(dedupeKey)) continue;
  seen.add(dedupeKey);
  candidates.push({
    '来源': '6月活跃但7月缺失且未进入CRM目标',
    '负责人': text(f['负责人']),
    '红人名称': text(f['红人名称']),
    '红人编码': text(f['红人编码']),
    '地区': text(f['地区']),
    '平台': platform,
    '红人主页链接': profileUrl,
    '合作日期': text(f['合作日期']),
    '合作进度': text(f['合作进度']),
    'maxItems': platform === 'youtubevideo' ? 10 : 20,
    '处理建议': '补拉7月13日至今增量；已排除今日成功扫描主页'
  });
}

candidates.sort((a, b) => a['平台'].localeCompare(b['平台']) || a['红人名称'].localeCompare(b['红人名称']));
await fs.mkdir(OUTPUT_DIR, { recursive: true });
await writeCsv(path.join(OUTPUT_DIR, '高置信漏抓补拉队列.csv'), candidates);
const summary = {
  generatedAt: new Date().toISOString(),
  runtimeRoot: RUNTIME_ROOT,
  juneCreatorCount: juneCreators.size,
  julyCreatorCount: julyCreators.size,
  crmTargetCount: (crmTargets.rows || []).length,
  scannedTodayCount: scannedToday.size,
  targetCount: candidates.length,
  targetCreators: new Set(candidates.map((row) => normalizeName(row['红人名称']))).size,
  targetByPlatform: candidates.reduce((acc, row) => {
    acc[row['平台']] = (acc[row['平台']] || 0) + 1;
    return acc;
  }, {})
};
await fs.writeFile(path.join(OUTPUT_DIR, '队列汇总.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
