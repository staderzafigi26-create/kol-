import fs from 'node:fs/promises';

const CSV_PATH = '/Users/ryan/Documents/项目编程/outputs/anniversary_competition_platform_list_2026-06-11.csv';
const BASE_URL = process.env.LOCAL_CENTER_BASE_URL || 'http://127.0.0.1:3000';
const REPORT_DIR = 'data/reports';
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const QUEUE_JSON = `${REPORT_DIR}/anniversary-crawl-queue-${RUN_STAMP}.json`;
const QUEUE_CSV = `${REPORT_DIR}/anniversary-crawl-queue-${RUN_STAMP}.csv`;
const REPORT_PATH = `${REPORT_DIR}/anniversary-crawl-run-${RUN_STAMP}.json`;
const MISSING_PATH = `${REPORT_DIR}/anniversary-crawl-missing-${RUN_STAMP}.csv`;
const END_OF_TODAY = '2026-06-12T00:00:00+08:00';
const MONTH_DAYS = 11;
const RECENT_DAYS = 5;
const MONTH_MAX_ITEMS = 25;
const RECENT_MAX_ITEMS = 20;
const HISTORY_REPORTS = [
  'data/reports/incremental-youtube-instagram-run-2026-06-07T07-08-39-430Z.json',
  'data/reports/incremental-youtube-instagram-retry-2026-06-07T07-43-42-767Z.json',
  'data/reports/incremental-tiktok-run-2026-06-07T08-16-26-240Z.json',
  'data/reports/p2-tiktok-day9-max25-2026-06-07T10-28-24-061Z.json'
];

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  })
);
const dryRunOnly = args.has('dry-run');
const offset = Math.max(0, Number(args.get('offset') || 0));
const limit = args.has('limit') ? Math.max(1, Number(args.get('limit') || 1)) : Infinity;
const platformArg = String(args.get('platform') || 'all').toLowerCase();
const modeArg = String(args.get('mode') || 'all').toLowerCase();

function parseCsvLine(line) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

function cellText(value) {
  if (value == null) return '';
  if (typeof value === 'object') return value.link || value.text || '';
  return String(value);
}

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]+/g, '');
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return raw.replace(/\/+$/, '').toLowerCase();
  }
}

function normalizePlatform(value, url = '') {
  const text = String(value || '').toLowerCase();
  const href = String(url || '').toLowerCase();
  if (text.includes('tiktok') || href.includes('tiktok.com')) return 'tiktok';
  if (text.includes('instagram') || href.includes('instagram.com')) return 'instagramreels';
  if (text.includes('short') || href.includes('/shorts')) return 'youtubeshort';
  if (text.includes('youtube') || text === 'yt' || href.includes('youtube.com') || href.includes('youtu.be')) return 'youtubevideo';
  return text;
}

function platformsFromCsv(value) {
  const output = [];
  for (const token of String(value || '').split(',').map((item) => item.trim()).filter(Boolean)) {
    if (token === 'TK') output.push('tiktok');
    if (token === 'IG') output.push('instagramreels');
    if (token === 'YT') output.push('youtubevideo', 'youtubeshort');
  }
  return [...new Set(output)];
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function writeCsv(path, rows, headers) {
  const body = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n');
  await fs.writeFile(path, `${body}\n`);
}

function addToMap(map, key, value) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(value);
  map.set(key, list);
}

function getVideoTimestamp(fields) {
  return parseDate(fields.timestamp || fields.publishedAt || fields.publishDate || fields.date);
}

function buildHistoricalRunSet() {
  const set = new Set();
  return Promise.all(
    HISTORY_REPORTS.map(async (path) => {
      try {
        const report = JSON.parse(await fs.readFile(path, 'utf8'));
        for (const result of report.results || []) {
          if (!result.ok || !result.homeUrl || !result.platform) continue;
          set.add(`${result.platform}__${normalizeUrl(result.homeUrl)}`);
        }
      } catch {
        // Older report files are optional.
      }
    })
  ).then(() => set);
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
    snapshotCreated: 0,
    byPlatform: {},
    byMode: {}
  };
  for (const result of results) {
    const platform = result.platform || 'unknown';
    const mode = result.mode || 'unknown';
    summary.byPlatform[platform] ||= { total: 0, success: 0, failed: 0, usageUsd: 0, videoCreated: 0, videoSkipped: 0 };
    summary.byMode[mode] ||= { total: 0, success: 0, failed: 0, usageUsd: 0, videoCreated: 0, videoSkipped: 0 };
    for (const bucket of [summary.byPlatform[platform], summary.byMode[mode]]) {
      bucket.total += 1;
      if (result.ok) bucket.success += 1;
      else bucket.failed += 1;
    }
    if (result.ok) summary.success += 1;
    else summary.failed += 1;
    const runSummary = result.data?.summary || {};
    const usageUsd = Number(runSummary.usageUsd || 0);
    const videoCreated = Number(runSummary.videoCreated || 0);
    const videoSkipped = Number(runSummary.videoSkipped || 0);
    summary.usageUsd += usageUsd;
    summary.scraped += Number(runSummary.scraped || 0);
    summary.matched += Number(runSummary.matched || 0);
    summary.videoCreated += videoCreated;
    summary.videoSkipped += videoSkipped;
    summary.snapshotCreated += Number(runSummary.snapshotCreated || 0);
    summary.byPlatform[platform].usageUsd += usageUsd;
    summary.byPlatform[platform].videoCreated += videoCreated;
    summary.byPlatform[platform].videoSkipped += videoSkipped;
    summary.byMode[mode].usageUsd += usageUsd;
    summary.byMode[mode].videoCreated += videoCreated;
    summary.byMode[mode].videoSkipped += videoSkipped;
  }
  summary.usageUsd = Number(summary.usageUsd.toFixed(6));
  for (const bucket of [...Object.values(summary.byPlatform), ...Object.values(summary.byMode)]) {
    bucket.usageUsd = Number(bucket.usageUsd.toFixed(6));
  }
  return summary;
}

async function saveReport(queue, missing, results, done = false) {
  const report = {
    done,
    startedAt,
    updatedAt: new Date().toISOString(),
    csvPath: CSV_PATH,
    queueJson: QUEUE_JSON,
    queueCsv: QUEUE_CSV,
    missingCsv: MISSING_PATH,
    parameters: {
      endOfToday: END_OF_TODAY,
      recent: { days: RECENT_DAYS, maxItems: RECENT_MAX_ITEMS },
      month: { days: MONTH_DAYS, maxItems: MONTH_MAX_ITEMS },
      offset,
      limit: Number.isFinite(limit) ? limit : 'all',
      platform: platformArg,
      mode: modeArg
    },
    queueSummary: summarizeQueue(queue),
    missingCount: missing.length,
    summary: summarize(results),
    results
  };
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  return report;
}

function summarizeQueue(queue) {
  return {
    total: queue.length,
    byPlatform: queue.reduce((acc, row) => {
      acc[row.platform] = (acc[row.platform] || 0) + 1;
      return acc;
    }, {}),
    byMode: queue.reduce((acc, row) => {
      acc[row.mode] = (acc[row.mode] || 0) + 1;
      return acc;
    }, {})
  };
}

function shouldRetry(errorText = '') {
  return errorText.includes('已有本地抓取任务正在运行') || errorText.includes('fetch failed') || errorText.includes('network');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    includeUnmonitoredTargets: true,
    publishedBefore: END_OF_TODAY,
    actorLookbackDays: row.days + 1,
    globalKeywords: 'yozma,yozmasport,in10,IN 10,YozmaAnniversaryChallenge,anniversary challenge'
  };
  const attempts = [];
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const attemptStartedAt = new Date().toISOString();
    try {
      const response = await fetch(`${BASE_URL}/api/local/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      const error = data.error || data.message || (response.ok ? '' : `HTTP ${response.status}`);
      attempts.push({ attempt, startedAt: attemptStartedAt, finishedAt: new Date().toISOString(), status: response.status, error });
      if (response.ok && data.ok !== false) return { ok: true, status: response.status, data, attempts };
      if (!shouldRetry(error)) return { ok: false, status: response.status, data, error, attempts };
    } catch (error) {
      const message = error?.message || String(error);
      attempts.push({ attempt, startedAt: attemptStartedAt, finishedAt: new Date().toISOString(), error: message });
      if (!shouldRetry(message)) return { ok: false, error: message, attempts };
    }
    await wait(15000 * attempt);
  }
  return { ok: false, error: attempts.at(-1)?.error || 'retry exhausted', attempts };
}

const startedAt = new Date().toISOString();
await fs.mkdir(REPORT_DIR, { recursive: true });

const [competitionRows, influencerRows, videoRows, historicalRunSet] = await Promise.all([
  fs.readFile(CSV_PATH, 'utf8').then(parseCsv),
  fs.readFile('data/local/influencers.json', 'utf8').then((text) => JSON.parse(text)),
  fs.readFile('data/local/videos.json', 'utf8').then((text) => JSON.parse(text)),
  buildHistoricalRunSet()
]);

const influencers = influencerRows.map((row) => ({ raw: row, fields: row.fields || row }));
const byCode = new Map();
const byEmail = new Map();
const byName = new Map();
for (const influencer of influencers) {
  const fields = influencer.fields;
  addToMap(byCode, normalizeName(fields['红人编码'] || fields.code), influencer);
  addToMap(byEmail, normalizeName(fields.email), influencer);
  addToMap(byName, normalizeName(fields['红人名称']), influencer);
}

const videoStats = new Map();
for (const row of videoRows) {
  const fields = row.fields || row;
  const creator = normalizeName(fields['红人名称']);
  const platform = normalizePlatform(cellText(fields['平台']), cellText(fields.url));
  if (!creator || !platform) continue;
  const key = `${creator}__${platform}`;
  const current = videoStats.get(key) || { count: 0, latest: null };
  const timestamp = getVideoTimestamp(fields);
  current.count += 1;
  if (timestamp && (!current.latest || timestamp > current.latest)) current.latest = timestamp;
  videoStats.set(key, current);
}

const queue = [];
const missing = [];
const seenTargets = new Set();
for (const row of competitionRows) {
  const wantedPlatforms = platformsFromCsv(row.platforms);
  for (const wantedPlatform of wantedPlatforms) {
    const candidates = [];
    const seenCandidates = new Set();
    for (const candidate of [
      ...(byCode.get(normalizeName(row.code)) || []),
      ...(byEmail.get(normalizeName(row.email)) || []),
      ...(byName.get(normalizeName(row.name)) || [])
    ]) {
      const id = candidate.raw.id || JSON.stringify(candidate.fields);
      if (seenCandidates.has(id)) continue;
      seenCandidates.add(id);
      candidates.push(candidate);
    }

    const platformMatches = candidates.filter((candidate) => {
      const platform = normalizePlatform(cellText(candidate.fields['平台']), cellText(candidate.fields['红人链接']));
      return platform === wantedPlatform;
    });
    const chosen =
      platformMatches[0] ||
      (wantedPlatform.startsWith('youtube')
        ? candidates.find((candidate) => normalizePlatform(cellText(candidate.fields['平台']), cellText(candidate.fields['红人链接'])).startsWith('youtube'))
        : null);

    if (!chosen || !cellText(chosen.fields['红人链接'])) {
      missing.push({
        name: row.name,
        code: row.code,
        owner: row.owner,
        csvPlatform: wantedPlatform,
        localCandidates: candidates
          .map((candidate) => `${cellText(candidate.fields['红人名称'])} / ${cellText(candidate.fields['平台'])} / ${cellText(candidate.fields['红人链接'])}`)
          .join(' | ')
      });
      continue;
    }

    const homeUrl = cellText(chosen.fields['红人链接']);
    const actualPlatform = wantedPlatform.startsWith('youtube') ? normalizePlatform(cellText(chosen.fields['平台']), homeUrl) : wantedPlatform;
    const creatorKey = normalizeName(row.name);
    const localCreatorKey = normalizeName(chosen.fields['红人名称']);
    const stats = videoStats.get(`${creatorKey}__${actualPlatform}`) || videoStats.get(`${localCreatorKey}__${actualPlatform}`) || { count: 0, latest: null };
    const historyKey = `${actualPlatform}__${normalizeUrl(homeUrl)}`;
    const latestDate = stats.latest ? stats.latest.toISOString().slice(0, 10) : '';
    const recentlyKnown = latestDate >= '2026-06-05';
    const hasHistory = historicalRunSet.has(historyKey);
    const mode = hasHistory || recentlyKnown ? 'recent5' : 'month';
    const targetKey = `${row.code || row.name}__${actualPlatform}__${normalizeUrl(homeUrl)}`;
    if (seenTargets.has(targetKey)) continue;
    seenTargets.add(targetKey);
    queue.push({
      name: row.name,
      email: row.email,
      owner: row.owner,
      code: row.code,
      progress: row.progress,
      csvPlatforms: row.platforms,
      csvPlatform: wantedPlatform,
      platform: actualPlatform,
      homeUrl,
      localName: cellText(chosen.fields['红人名称']),
      localPlatform: cellText(chosen.fields['平台']),
      monitor: cellText(chosen.fields['是否监控']),
      mode,
      days: mode === 'recent5' ? RECENT_DAYS : MONTH_DAYS,
      maxItems: mode === 'recent5' ? RECENT_MAX_ITEMS : MONTH_MAX_ITEMS,
      previousVideoCount: stats.count,
      previousLatestVideo: latestDate,
      hasHistoryRun: hasHistory ? '是' : '否'
    });
  }
}

const filteredQueue = queue
  .filter((row) => (platformArg === 'all' ? true : row.platform === platformArg))
  .filter((row) => (modeArg === 'all' ? true : row.mode === modeArg))
  .slice(offset, Number.isFinite(limit) ? offset + limit : undefined);

await fs.writeFile(QUEUE_JSON, JSON.stringify({ createdAt: startedAt, csvPath: CSV_PATH, queue, filteredQueue, missing }, null, 2));
await writeCsv(QUEUE_CSV, filteredQueue, [
  'name',
  'code',
  'owner',
  'platform',
  'mode',
  'days',
  'maxItems',
  'previousVideoCount',
  'previousLatestVideo',
  'hasHistoryRun',
  'monitor',
  'homeUrl'
]);
await writeCsv(MISSING_PATH, missing, ['name', 'code', 'owner', 'csvPlatform', 'localCandidates']);

console.log(JSON.stringify({ event: 'queue-ready', queueJson: QUEUE_JSON, queueCsv: QUEUE_CSV, missingCsv: MISSING_PATH, queue: summarizeQueue(filteredQueue), missing: missing.length }));

const results = [];
await saveReport(filteredQueue, missing, results, false);
if (dryRunOnly) {
  console.log(JSON.stringify({ event: 'dry-run-done', reportPath: REPORT_PATH }));
  process.exit(0);
}

for (let index = 0; index < filteredQueue.length; index += 1) {
  const row = filteredQueue[index];
  const result = {
    index: index + 1,
    total: filteredQueue.length,
    name: row.name,
    code: row.code,
    owner: row.owner,
    platform: row.platform,
    mode: row.mode,
    days: row.days,
    maxItems: row.maxItems,
    homeUrl: row.homeUrl,
    startedAt: new Date().toISOString()
  };
  const run = await runOne(row);
  Object.assign(result, run, { finishedAt: new Date().toISOString() });
  results.push(result);
  const runSummary = result.data?.summary || {};
  console.log(JSON.stringify({
    event: 'progress',
    index: result.index,
    total: result.total,
    name: result.name,
    platform: result.platform,
    mode: result.mode,
    ok: result.ok,
    usageUsd: Number(runSummary.usageUsd || 0),
    scraped: Number(runSummary.scraped || 0),
    matched: Number(runSummary.matched || 0),
    videoCreated: Number(runSummary.videoCreated || 0),
    videoSkipped: Number(runSummary.videoSkipped || 0),
    error: result.error || ''
  }));
  await saveReport(filteredQueue, missing, results, false);
}

const finalReport = await saveReport(filteredQueue, missing, results, true);
console.log(JSON.stringify({ event: 'done', reportPath: REPORT_PATH, summary: finalReport.summary }));
