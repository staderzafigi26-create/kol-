import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const API_BASE = process.env.LOCAL_API_BASE || 'http://127.0.0.1:3000';
const QUEUE_FILE = path.join(ROOT, 'data', 'reports', 'month-gap-retry-20260720', '高置信漏抓补拉队列.csv');
const REPORT_DIR = path.join(ROOT, 'data', 'reports', 'month-gap-retry-20260720');
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || true];
}));
const PLATFORM = String(args.get('platform') || '');
const DRY_RUN = args.has('dry-run');
const BATCH_SIZE = Math.max(1, Number(args.get('batch-size') || (PLATFORM === 'tiktok' ? 3 : 5)));
const BUDGET_USD = Math.max(0, Number(args.get('budget-usd') || 0));
const PUBLISHED_AFTER = String(args.get('published-after') || '2026-07-12T16:00:00.000Z');
const PUBLISHED_BEFORE = String(args.get('published-before') || new Date().toISOString());
const MAX_ITEMS = PLATFORM === 'youtubevideo' ? 10 : 20;

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

function csvEscape(value) {
  const output = value == null ? '' : String(value);
  return /[",\n\r]/.test(output) ? `"${output.replace(/"/g, '""')}"` : output;
}

async function writeCsv(filePath, rows) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [headers.join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))];
  await fs.writeFile(filePath, `\uFEFF${lines.join('\n')}\n`, 'utf8');
}

function chunks(rows, size) {
  const result = [];
  for (let index = 0; index < rows.length; index += size) result.push(rows.slice(index, index + size));
  return result;
}

async function discover(payload) {
  const response = await fetch(`${API_BASE}/api/local/discover`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.ok) throw new Error(json.error || `HTTP ${response.status}`);
  return json;
}

if (!PLATFORM) throw new Error('必须提供 --platform。');
const allRows = parseCsv(await fs.readFile(QUEUE_FILE, 'utf8'));
const targets = allRows.filter((row) => row['平台'] === PLATFORM);
const basePayload = {
  days: 8,
  maxItems: MAX_ITEMS,
  globalKeywords: 'yozma,yozmasport,IN10,IN 10,IN-10',
  limitInfluencers: BATCH_SIZE + 5,
  skipInfluencers: 0,
  platformFilter: PLATFORM,
  publishedAfter: PUBLISHED_AFTER,
  publishedBefore: PUBLISHED_BEFORE,
  actorLookbackDays: 9,
  includeUnmonitoredTargets: true
};

const preflight = await discover({
  ...basePayload,
  limitInfluencers: targets.length + 5,
  onlyInfluencerInputs: targets.map((row) => row['红人主页链接']),
  dryRun: true
});
const preflightSummary = {
  generatedAt: new Date().toISOString(),
  platform: PLATFORM,
  period: { publishedAfter: PUBLISHED_AFTER, publishedBefore: PUBLISHED_BEFORE },
  targets: targets.length,
  estimate: preflight.usageEstimate,
  usageBudget: preflight.usageBudget,
  dryRun: DRY_RUN
};
await fs.writeFile(path.join(REPORT_DIR, `补拉预检-${PLATFORM}.json`), `${JSON.stringify(preflightSummary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(preflightSummary, null, 2));
if (DRY_RUN || !targets.length) process.exit(0);

const rows = [];
let totalUsageUsd = 0;
let stoppedReason = '';
for (const [batchIndex, batch] of chunks(targets, BATCH_SIZE).entries()) {
  if (BUDGET_USD && totalUsageUsd >= BUDGET_USD) {
    stoppedReason = '达到本轮成本上限';
    break;
  }
  const onlyInfluencerInputs = batch.map((row) => row['红人主页链接']);
  try {
    const batchPreflight = await discover({ ...basePayload, onlyInfluencerInputs, dryRun: true });
    const result = await discover({
      ...basePayload,
      onlyInfluencerInputs,
      tiktokApprovalId: batchPreflight.approvalId || '',
      dryRun: false
    });
    const usageUsd = Number(result.summary?.usageUsd || 0);
    totalUsageUsd += usageUsd;
    rows.push({
      platform: PLATFORM,
      batch: batchIndex + 1,
      targets: batch.length,
      status: result.status || 'success',
      processed: result.processedInfluencers || 0,
      scraped: result.summary?.scraped || 0,
      matched: result.summary?.matched || 0,
      created: result.summary?.videoCreated || 0,
      duplicates: result.summary?.videoSkipped || 0,
      usageUsd,
      totalUsageUsd: Number(totalUsageUsd.toFixed(6)),
      error: ''
    });
  } catch (error) {
    rows.push({ platform: PLATFORM, batch: batchIndex + 1, targets: batch.length, status: 'failed', processed: 0, scraped: 0, matched: 0, created: 0, duplicates: 0, usageUsd: 0, totalUsageUsd: Number(totalUsageUsd.toFixed(6)), error: error.message });
    if (/额度不足|not-enough|usage|402|billing|exceed/i.test(error.message)) {
      stoppedReason = error.message;
      break;
    }
  }
  await writeCsv(path.join(REPORT_DIR, `补拉执行日志-${PLATFORM}.csv`), rows);
}

const summary = {
  ...preflightSummary,
  finishedAt: new Date().toISOString(),
  totalUsageUsd: Number(totalUsageUsd.toFixed(6)),
  stoppedReason,
  batches: rows.length,
  processed: rows.reduce((sum, row) => sum + Number(row.processed || 0), 0),
  scraped: rows.reduce((sum, row) => sum + Number(row.scraped || 0), 0),
  matched: rows.reduce((sum, row) => sum + Number(row.matched || 0), 0),
  created: rows.reduce((sum, row) => sum + Number(row.created || 0), 0),
  duplicates: rows.reduce((sum, row) => sum + Number(row.duplicates || 0), 0),
  failures: rows.filter((row) => row.status === 'failed').length
};
await writeCsv(path.join(REPORT_DIR, `补拉执行日志-${PLATFORM}.csv`), rows);
await fs.writeFile(path.join(REPORT_DIR, `补拉结果-${PLATFORM}.json`), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
