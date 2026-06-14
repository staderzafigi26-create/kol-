import fs from 'node:fs/promises';

const BASE_URL = process.env.LOCAL_CENTER_BASE_URL || 'http://127.0.0.1:3000';
const REPORT_DIR = 'data/reports';
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_PATH = `${REPORT_DIR}/monitor-split-budget-crawl-${RUN_STAMP}.json`;
const QUEUE_PATH = `${REPORT_DIR}/monitor-split-budget-crawl-queue-${RUN_STAMP}.csv`;
const BUDGET_USD = Number(process.env.CRAWL_BUDGET_USD || 6.2);
const RESUME_REPORT = process.env.RESUME_REPORT || '';
const CONCURRENCY = Math.max(1, Number(process.env.CRAWL_CONCURRENCY || 4));
const GLOBAL_KEYWORDS = 'yozma,yozmasport,in10';
const COVERAGE_REPORT = 'data/reports/anniversary-crawl-run-2026-06-11T09-53-40-557Z.json';
const COVERAGE_QUEUE = 'data/reports/anniversary-crawl-queue-2026-06-11T09-53-40-557Z.json';
const ESTIMATE_UNIT = {
  instagramreels: 0.0021,
  tiktok: 0.0359,
  youtubevideo: 0.0006,
  youtubeshort: 0.0041
};

const PRIORITY = {
  A: 1,
  B_NON_TIKTOK: 2,
  B_TIKTOK: 3
};

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') return String(value.link || value.text || value.url || '').trim();
  return String(value).trim();
}

function normalizePlatform(value, url = '') {
  const raw = text(value).toLowerCase().replace(/[\s_-]+/g, '');
  const href = text(url).toLowerCase();
  if (raw.includes('tiktok') || href.includes('tiktok.com')) return 'tiktok';
  if (raw.includes('instagram') || raw.includes('reels') || href.includes('instagram.com')) return 'instagramreels';
  if (raw.includes('short') || href.includes('/shorts')) return 'youtubeshort';
  if (raw.includes('youtube') || href.includes('youtube.com') || href.includes('youtu.be')) return 'youtubevideo';
  return raw;
}

function normalizeUrl(value) {
  const raw = text(value);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.hostname.replace(/^www\./, '').toLowerCase()}${parsed.pathname}`.toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '');
  }
}

function normalizeName(value) {
  return text(value)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/https?:\/\/[^/]+\/@?/, '')
    .replace(/[?/#].*$/, '')
    .replace(/[^a-z0-9]+/g, '');
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

async function readJson(path, fallback) {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function addCoverage(setUrl, setName, row) {
  const platform = normalizePlatform(row.platform || row.csvPlatform || row.localPlatform, row.homeUrl);
  const url = normalizeUrl(row.homeUrl);
  const name = normalizeName(row.name || row.localName || row.creator);
  if (platform && url) setUrl.add(`${platform}__${url}`);
  if (platform && name) setName.add(`${platform}__${name}`);
}

function summarize(results) {
  const summary = {
    total: results.length,
    success: 0,
    failed: 0,
    skippedByBudget: 0,
    usageUsd: 0,
    scraped: 0,
    matched: 0,
    videoCreated: 0,
    videoSkipped: 0,
    snapshotCreated: 0,
    byBatch: {},
    byPlatform: {}
  };
  for (const result of results) {
    const batch = result.batch || 'unknown';
    const platform = result.platform || 'unknown';
    summary.byBatch[batch] ||= { total: 0, success: 0, failed: 0, skippedByBudget: 0, usageUsd: 0, videoCreated: 0 };
    summary.byPlatform[platform] ||= { total: 0, success: 0, failed: 0, skippedByBudget: 0, usageUsd: 0, videoCreated: 0 };
    summary.byBatch[batch].total += 1;
    summary.byPlatform[platform].total += 1;
    if (result.skippedByBudget) {
      summary.skippedByBudget += 1;
      summary.byBatch[batch].skippedByBudget += 1;
      summary.byPlatform[platform].skippedByBudget += 1;
      continue;
    }
    if (result.ok) {
      summary.success += 1;
      summary.byBatch[batch].success += 1;
      summary.byPlatform[platform].success += 1;
    } else {
      summary.failed += 1;
      summary.byBatch[batch].failed += 1;
      summary.byPlatform[platform].failed += 1;
    }
    const runSummary = result.data?.summary || {};
    const usageUsd = Number(runSummary.usageUsd || 0);
    const videoCreated = Number(runSummary.videoCreated || 0);
    summary.usageUsd += usageUsd;
    summary.scraped += Number(runSummary.scraped || 0);
    summary.matched += Number(runSummary.matched || 0);
    summary.videoCreated += videoCreated;
    summary.videoSkipped += Number(runSummary.videoSkipped || 0);
    summary.snapshotCreated += Number(runSummary.snapshotCreated || 0);
    summary.byBatch[batch].usageUsd += usageUsd;
    summary.byBatch[batch].videoCreated += videoCreated;
    summary.byPlatform[platform].usageUsd += usageUsd;
    summary.byPlatform[platform].videoCreated += videoCreated;
  }
  summary.usageUsd = Number(summary.usageUsd.toFixed(6));
  for (const bucket of [...Object.values(summary.byBatch), ...Object.values(summary.byPlatform)]) {
    bucket.usageUsd = Number(bucket.usageUsd.toFixed(6));
  }
  return summary;
}

function rowKey(row) {
  return `${row.batch}__${row.platform}__${normalizeUrl(row.homeUrl)}__${normalizeName(row.creator)}`;
}

async function saveReport({ queue, results, done = false, stoppedReason = '' }) {
  const report = {
    done,
    startedAt,
    updatedAt: new Date().toISOString(),
    budgetUsd: BUDGET_USD,
    resumeReport: RESUME_REPORT,
    concurrency: CONCURRENCY,
    stoppedReason,
    queuePath: QUEUE_PATH,
    parameters: {
      A: { days: 3, maxItems: 15, description: 'covered to 2026-06-11; fetch 2026-06-11 to now' },
      B: { days: 7, maxItems: 25, description: 'not covered to 2026-06-11; fetch last 7 days' }
    },
    queueSummary: queue.reduce((acc, row) => {
      acc[row.batch] ||= { total: 0, byPlatform: {} };
      acc[row.batch].total += 1;
      acc[row.batch].byPlatform[row.platform] = (acc[row.batch].byPlatform[row.platform] || 0) + 1;
      return acc;
    }, {}),
    summary: summarize(results),
    results
  };
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  return report;
}

async function runOne(row) {
  const payload = {
    dryRun: false,
    days: row.days,
    maxItems: row.maxItems,
    limitInfluencers: 1,
    skipInfluencers: 0,
    platformFilter: row.platform,
    onlyInfluencerInputs: [row.homeUrl],
    globalKeywords: GLOBAL_KEYWORDS
  };
  if (row.publishedBefore) payload.publishedBefore = row.publishedBefore;
  const response = await fetch(`${BASE_URL}/api/local/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  const ok = response.ok && data.ok !== false;
  return {
    ok,
    status: response.status,
    data,
    error: ok ? '' : data.error || data.message || `HTTP ${response.status}`
  };
}

const startedAt = new Date().toISOString();
const influencers = await readJson('data/local/influencers.json', []);
const resumeReport = RESUME_REPORT ? await readJson(RESUME_REPORT, {}) : {};
const coverageReport = await readJson(COVERAGE_REPORT, {});
const coverageQueue = await readJson(COVERAGE_QUEUE, {});

const coveredUrlSet = new Set();
const coveredNameSet = new Set();
for (const result of coverageReport.results || []) {
  if (result.ok) addCoverage(coveredUrlSet, coveredNameSet, result);
}
for (const row of coverageQueue.filteredQueue || []) addCoverage(coveredUrlSet, coveredNameSet, row);

const supported = new Set(Object.keys(ESTIMATE_UNIT));
const queue = [];
for (const influencer of influencers) {
  const fields = influencer.fields || {};
  if (text(fields['是否监控']) !== '是') continue;
  const platform = normalizePlatform(fields['平台'], fields['红人链接']);
  const homeUrl = text(fields['红人链接']);
  if (!supported.has(platform) || !homeUrl) continue;
  const name = text(fields['红人名称']);
  const keyUrl = normalizeUrl(homeUrl);
  const keyName = normalizeName(name);
  const covered = coveredUrlSet.has(`${platform}__${keyUrl}`) || coveredNameSet.has(`${platform}__${keyName}`);
  const batch = covered ? 'A' : (platform === 'tiktok' ? 'B_TIKTOK' : 'B_NON_TIKTOK');
  queue.push({
    id: influencer.id || '',
    batch,
    priority: PRIORITY[batch],
    creator: name,
    platform,
    owner: text(fields['负责人']),
    code: text(fields['红人编码']),
    homeUrl,
    days: covered ? 3 : 7,
    maxItems: covered ? 15 : 25,
    publishedBefore: '',
    estimatedUsd: ESTIMATE_UNIT[platform] || 0.01
  });
}

queue.sort((a, b) => a.priority - b.priority || a.platform.localeCompare(b.platform) || a.creator.localeCompare(b.creator));
await writeCsv(QUEUE_PATH, queue, [
  'batch',
  'creator',
  'platform',
  'owner',
  'code',
  'homeUrl',
  'days',
  'maxItems',
  'estimatedUsd'
]);

queue.forEach((row, index) => {
  row.originalIndex = index + 1;
  row.total = queue.length;
});

const completedKeys = new Set();
const results = [];
for (const result of resumeReport.results || []) {
  if (result.skippedByBudget) continue;
  if (!result.ok) continue;
  completedKeys.add(rowKey(result));
  results.push(result);
}

const pendingQueue = queue.filter((row) => !completedKeys.has(rowKey(row)));
let stoppedReason = '';
console.log(JSON.stringify({
  event: 'start',
  reportPath: REPORT_PATH,
  queuePath: QUEUE_PATH,
  budgetUsd: BUDGET_USD,
  resumeReport: RESUME_REPORT,
  concurrency: CONCURRENCY,
  queued: queue.length,
  alreadyDone: results.length,
  pending: pendingQueue.length,
  byBatch: queue.reduce((acc, row) => {
    acc[row.batch] = (acc[row.batch] || 0) + 1;
    return acc;
  }, {})
}));

let nextPendingIndex = 0;
let activeEstimatedUsd = 0;
let saveCounter = 0;

async function takeNextRow() {
  if (stoppedReason) return null;
  const spent = summarize(results).usageUsd;
  if (spent >= BUDGET_USD) {
    stoppedReason = `本轮费用已达到预算保护线 $${BUDGET_USD}`;
    return null;
  }
  while (nextPendingIndex < pendingQueue.length) {
    const row = pendingQueue[nextPendingIndex];
    const predicted = Number(row.estimatedUsd || 0);
    if (spent + activeEstimatedUsd + predicted > BUDGET_USD && row.batch === 'B_TIKTOK') {
      stoppedReason = `剩余预算不足以安全继续 TikTok：已用 $${spent}，运行中预估 $${activeEstimatedUsd.toFixed(4)}，预算线 $${BUDGET_USD}`;
      return null;
    }
    nextPendingIndex += 1;
    activeEstimatedUsd += predicted;
    return row;
  }
  return null;
}

async function worker(workerId) {
  while (true) {
    const row = await takeNextRow();
    if (!row) break;
    const result = {
      ...row,
      index: row.originalIndex,
      total: row.total,
      workerId,
      startedAt: new Date().toISOString(),
      ok: false
    };
    try {
      const run = await runOne(row);
      Object.assign(result, run);
    } catch (error) {
      result.error = error?.message || String(error);
    } finally {
      activeEstimatedUsd = Math.max(0, activeEstimatedUsd - Number(row.estimatedUsd || 0));
    }
    result.finishedAt = new Date().toISOString();
    results.push(result);
    const runSummary = result.data?.summary || {};
    console.log(JSON.stringify({
      event: 'progress',
      workerId,
      index: result.index,
      total: result.total,
      pendingDone: nextPendingIndex,
      pendingTotal: pendingQueue.length,
      batch: result.batch,
      creator: result.creator,
      platform: result.platform,
      ok: result.ok,
      usageUsd: Number(runSummary.usageUsd || 0),
      accumulatedUsd: summarize(results).usageUsd,
      videoCreated: Number(runSummary.videoCreated || 0),
      videoSkipped: Number(runSummary.videoSkipped || 0),
      error: result.error || ''
    }));
    saveCounter += 1;
    if (saveCounter % 10 === 0 || !result.ok) await saveReport({ queue, results });
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, (_, index) => worker(index + 1)));

if (stoppedReason) {
  const row = pendingQueue[nextPendingIndex] || pendingQueue[pendingQueue.length - 1] || queue[queue.length - 1];
  if (row) {
    results.push({
      ...row,
      index: row.originalIndex,
      total: row.total,
      skippedByBudget: true,
      ok: false,
      error: stoppedReason
    });
  }
}

const finalReport = await saveReport({ queue, results, done: true, stoppedReason });
console.log(JSON.stringify({ event: 'done', reportPath: REPORT_PATH, summary: finalReport.summary, stoppedReason }));
