import fs from 'node:fs/promises';

const BASE_URL = process.env.LOCAL_CENTER_BASE_URL || 'http://127.0.0.1:3000';
const INPUT_PATH = process.env.RECHECK_INPUT || 'data/reports/tiktok-week-drop-audit-20260615-cheap-recheck-candidates.csv';
const LIMIT = Math.max(1, Number(process.env.RECHECK_LIMIT || 20));
const DAYS = Math.max(1, Number(process.env.RECHECK_DAYS || 9));
const MAX_ITEMS = Math.max(1, Number(process.env.RECHECK_MAX_ITEMS || 50));
const BUDGET_USD = Math.max(0.1, Number(process.env.RECHECK_BUDGET_USD || 3));
const REPORT_DIR = 'data/reports';
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const OUTPUT_PATH = `${REPORT_DIR}/tiktok-week-drop-recheck-${RUN_STAMP}.json`;
const QUEUE_PATH = `${REPORT_DIR}/tiktok-week-drop-recheck-queue-${RUN_STAMP}.csv`;
const INFLUENCERS_PATH = 'data/local/influencers.json';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const input = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value !== '')) rows.push(row);
  }
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function csvEscape(value) {
  const raw = value == null ? '' : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

async function writeCsv(path, rows, headers) {
  const body = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n');
  await fs.writeFile(path, `${body}\n`);
}

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') return String(value.link || value.text || value.url || '').trim();
  return String(value).trim();
}

function makeLinkCell(url) {
  return { link: url, text: url };
}

function makeLocalId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeHandle(value) {
  const raw = text(value).toLowerCase();
  const fromUrl = raw.match(/tiktok\.com\/@([^/?#]+)/)?.[1] || raw.match(/^@?([a-z0-9._-]+)$/)?.[1] || '';
  return fromUrl.replace(/^@+/, '').replace(/[^a-z0-9._-]+/g, '');
}

function profileUrlFromSample(sampleLinks, fallbackKey) {
  const first = String(sampleLinks || '').split('|').map((part) => part.trim()).find(Boolean);
  const handle = normalizeHandle(first) || normalizeHandle(fallbackKey);
  return handle ? `https://www.tiktok.com/@${handle}` : '';
}

function readFields(record) {
  return record.fields || record;
}

function getHomeUrl(fields) {
  return text(fields['红人链接']);
}

function summarize(results) {
  const summary = {
    total: results.length,
    success: 0,
    failed: 0,
    usageUsd: 0,
    scraped: 0,
    matched: 0,
    videoCreated: 0,
    videoSkipped: 0,
    snapshotCreated: 0
  };
  for (const result of results) {
    if (result.ok) summary.success += 1;
    else summary.failed += 1;
    const runSummary = result.data?.summary || {};
    summary.usageUsd += Number(runSummary.usageUsd || 0);
    summary.scraped += Number(runSummary.scraped || 0);
    summary.matched += Number(runSummary.matched || 0);
    summary.videoCreated += Number(runSummary.videoCreated || 0);
    summary.videoSkipped += Number(runSummary.videoSkipped || 0);
    summary.snapshotCreated += Number(runSummary.snapshotCreated || 0);
  }
  summary.usageUsd = Number(summary.usageUsd.toFixed(6));
  return summary;
}

async function saveReport(queue, results, done = false, stoppedReason = '') {
  const report = {
    done,
    startedAt,
    updatedAt: new Date().toISOString(),
    parameters: { days: DAYS, maxItems: MAX_ITEMS, limit: LIMIT, budgetUsd: BUDGET_USD },
    queuePath: QUEUE_PATH,
    stoppedReason,
    summary: summarize(results),
    queue,
    results
  };
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));
  return report;
}

async function runOne(row) {
  const payload = {
    dryRun: false,
    days: DAYS,
    maxItems: MAX_ITEMS,
    limitInfluencers: 1,
    skipInfluencers: 0,
    platformFilter: 'tiktok',
    onlyInfluencerInputs: [row.homeUrl],
    includeUnmonitoredTargets: true,
    globalKeywords: 'yozma,yozmasport,in10'
  };
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}/api/local/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    const ok = response.ok && data.ok !== false;
    const error = data.error || data.message || (response.ok ? '' : `HTTP ${response.status}`);
    if (ok) return { ok, status: response.status, data };
    if (!String(error).includes('已有本地抓取任务正在运行')) return { ok, status: response.status, data, error };
    await wait(15000 * attempt);
  }
  return { ok: false, error: 'retry exhausted' };
}

const startedAt = new Date().toISOString();
await fs.mkdir(REPORT_DIR, { recursive: true });

const candidates = parseCsv(await fs.readFile(INPUT_PATH, 'utf8'))
  .slice(0, LIMIT)
  .map((row, index) => ({
    rank: index + 1,
    creatorKey: row['达人Key'] || '',
    homeUrl: profileUrlFromSample(row['上上周样例链接'], row['达人Key']),
    previousVideos: Number(row['上上周TikTok视频'] || 0),
    currentVideos: Number(row['上周TikTok视频'] || 0),
    previousViews: Number(row['上上周声量'] || 0),
    currentViews: Number(row['上周声量'] || 0),
    diagnosis: row['判断'] || '',
    monitoringDistribution: row['当前是否监控分布'] || '',
    riskScore: Number(row['风险分'] || 0)
  }))
  .filter((row) => row.homeUrl);

const influencers = JSON.parse(await fs.readFile(INFLUENCERS_PATH, 'utf8'));
let changedInfluencers = false;
const handleToRecord = new Map();
for (const record of influencers) {
  const fields = readFields(record);
  const handle = normalizeHandle(getHomeUrl(fields) || fields['红人名称']);
  if (handle && !handleToRecord.has(handle)) handleToRecord.set(handle, record);
}

const queue = candidates.map((row) => {
  const handle = normalizeHandle(row.homeUrl);
  const existing = handleToRecord.get(handle);
  if (existing) {
    const fields = readFields(existing);
    fields['是否监控'] = '是';
    fields['平台'] = 'tiktok';
    fields['复查备注'] = '2026-06-15 TikTok周度下滑低成本复查';
    changedInfluencers = true;
    return { ...row, homeUrl: getHomeUrl(fields) || row.homeUrl, influencerStatus: 'matched-existing' };
  }
  const fields = {
    是否监控: '是',
    红人链接: makeLinkCell(row.homeUrl),
    平台: 'tiktok',
    是否出视频: row.previousVideos > 0 ? '是' : '否',
    红人名称: row.creatorKey || handle,
    样品型号: 'yozma,yozmasport,in10',
    追踪优先级: 'TikTok复查补录',
    复查备注: '2026-06-15 TikTok周度下滑低成本复查'
  };
  const record = { id: makeLocalId('inf'), fields, source: 'tiktok-recheck-import', importedAt: new Date().toISOString() };
  influencers.push(record);
  handleToRecord.set(handle, record);
  changedInfluencers = true;
  return { ...row, influencerStatus: 'created-temp-influencer' };
});

if (changedInfluencers) {
  await fs.writeFile(INFLUENCERS_PATH, JSON.stringify(influencers, null, 2));
}

await writeCsv(QUEUE_PATH, queue, [
  'rank',
  'creatorKey',
  'homeUrl',
  'influencerStatus',
  'previousVideos',
  'currentVideos',
  'previousViews',
  'currentViews',
  'monitoringDistribution',
  'riskScore',
  'diagnosis'
]);

console.log(JSON.stringify({ event: 'start', outputPath: OUTPUT_PATH, queuePath: QUEUE_PATH, queued: queue.length, parameters: { days: DAYS, maxItems: MAX_ITEMS, budgetUsd: BUDGET_USD } }));

const results = [];
let stoppedReason = '';
for (const row of queue) {
  const spent = summarize(results).usageUsd;
  if (spent >= BUDGET_USD) {
    stoppedReason = `费用达到保护线 $${BUDGET_USD}`;
    break;
  }
  const result = {
    ...row,
    startedAt: new Date().toISOString()
  };
  const run = await runOne(row);
  Object.assign(result, run, { finishedAt: new Date().toISOString() });
  results.push(result);
  const runSummary = result.data?.summary || {};
  console.log(JSON.stringify({
    event: 'progress',
    rank: row.rank,
    creator: row.creatorKey,
    ok: result.ok,
    usageUsd: Number(runSummary.usageUsd || 0),
    accumulatedUsd: summarize(results).usageUsd,
    scraped: Number(runSummary.scraped || 0),
    matched: Number(runSummary.matched || 0),
    videoCreated: Number(runSummary.videoCreated || 0),
    videoSkipped: Number(runSummary.videoSkipped || 0),
    error: result.error || ''
  }));
  await saveReport(queue, results, false, stoppedReason);
}

const report = await saveReport(queue, results, true, stoppedReason);
console.log(JSON.stringify({ event: 'done', outputPath: OUTPUT_PATH, summary: report.summary, stoppedReason }));
