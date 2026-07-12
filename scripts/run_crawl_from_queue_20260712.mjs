import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const API_BASE = process.env.LOCAL_API_BASE || 'http://127.0.0.1:3000';
const DEFAULT_QUEUE = path.join(
  ROOT,
  'data',
  'reports',
  'full-crawl-target-preview-20260712',
  'Ryan_Stefan建议抓取队列.csv'
);
const REPORT_DIR = path.join(ROOT, 'data', 'reports', 'crawl-run-2026-07-05_2026-07-12');
const PLATFORM_ORDER = ['youtubevideo', 'youtubeshort', 'instagramreels', 'tiktok'];
const PLATFORM_MAX_ITEMS = {
  youtubevideo: 7,
  youtubeshort: 20,
  instagramreels: 20,
  tiktok: 20
};
const PLATFORM_LABEL_TO_KEY = {
  'YouTube Video': 'youtubevideo',
  'YouTube Shorts': 'youtubeshort',
  'Instagram Reels': 'instagramreels',
  TikTok: 'tiktok'
};

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const QUEUE_FILE = [...args].find((arg) => arg.startsWith('--queue='))?.split('=')[1] || DEFAULT_QUEUE;
const SELECTED_PLATFORM = [...args].find((arg) => arg.startsWith('--platform='))?.split('=')[1] || '';
const MAX_TARGETS = Number([...args].find((arg) => arg.startsWith('--max-targets='))?.split('=')[1] || 0);
const BATCH_SIZE = Math.max(1, Number([...args].find((arg) => arg.startsWith('--batch-size='))?.split('=')[1] || process.env.CRAWL_BATCH_SIZE || 5));
const MAX_RUN_USAGE_USD = Number([...args].find((arg) => arg.startsWith('--budget-usd='))?.split('=')[1] || process.env.MAX_RUN_USAGE_USD || 0);

function csvEscape(value) {
  const output = value == null ? '' : String(value);
  return /[",\n\r]/.test(output) ? `"${output.replace(/"/g, '""')}"` : output;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = (rows.shift() || []).map((header) => header.replace(/^\uFEFF/, '').trim());
  return rows
    .filter((values) => values.some((value) => String(value).trim()))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] == null ? '' : values[index].trim()]))
    );
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
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

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeCsv(filePath, rows, headers) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const finalHeaders = headers || [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [
    finalHeaders.join(','),
    ...rows.map((row) => finalHeaders.map((key) => csvEscape(row[key])).join(','))
  ];
  await fs.writeFile(filePath, `\uFEFF${lines.join('\n')}\n`, 'utf8');
}

function chunk(rows, size) {
  const output = [];
  for (let i = 0; i < rows.length; i += size) output.push(rows.slice(i, i + size));
  return output;
}

function buildTargets(rows) {
  const seen = new Set();
  const targets = [];
  for (const row of rows) {
    const platform = PLATFORM_LABEL_TO_KEY[row['平台']] || row['平台'];
    if (!PLATFORM_ORDER.includes(platform)) continue;
    if (SELECTED_PLATFORM && platform !== SELECTED_PLATFORM) continue;
    const profileUrl = row['红人主页链接'] || '';
    const key = `${platform}__${normalizeUrl(profileUrl) || row['红人名称'] || row['红人编码']}`;
    if (!profileUrl || seen.has(key)) continue;
    seen.add(key);
    targets.push({
      source: row['来源'] || '',
      owner: row['负责人'] || '',
      creator: row['红人名称'] || '',
      code: row['红人编码'] || '',
      region: row['地区'] || '',
      platform,
      platformLabel: row['平台'] || platform,
      profileUrl,
      coopDate: row['合作日期'] || '',
      maxItems: PLATFORM_MAX_ITEMS[platform],
      reason: row['处理建议'] || ''
    });
  }
  return targets.slice(0, MAX_TARGETS > 0 ? MAX_TARGETS : undefined);
}

async function callLocalDiscover({ platform, urls, maxItems }) {
  const payload = {
    days: 8,
    maxItems,
    globalKeywords: 'yozma,yozmasport,IN10,IN 10,IN-10',
    limitInfluencers: Math.max(1, urls.length + 10),
    skipInfluencers: 0,
    onlyInfluencerInputs: urls,
    platformFilter: platform,
    publishedAfter: '2026-07-04T16:00:00.000Z',
    publishedBefore: '2026-07-13T00:00:00.000Z',
    actorLookbackDays: 9,
    includeUnmonitoredTargets: true,
    dryRun: false
  };
  const response = await fetch(`${API_BASE}/api/local/discover`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.ok) {
    throw new Error(json.error || `HTTP ${response.status}`);
  }
  return json;
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const rows = parseCsv(await fs.readFile(QUEUE_FILE, 'utf8'));
  const targets = buildTargets(rows);
  const preflight = {
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    queueFile: QUEUE_FILE,
    period: '2026-07-05 至 2026-07-12',
    selectedPlatform: SELECTED_PLATFORM || 'all',
    batchSize: BATCH_SIZE,
    budgetUsd: MAX_RUN_USAGE_USD || '',
    targetCount: targets.length,
    targetByPlatform: targets.reduce((acc, row) => {
      acc[row.platform] = (acc[row.platform] || 0) + 1;
      return acc;
    }, {})
  };
  await writeJson(path.join(REPORT_DIR, `preflight-${SELECTED_PLATFORM || 'all'}.json`), preflight);
  await writeCsv(path.join(REPORT_DIR, `targets-${SELECTED_PLATFORM || 'all'}.csv`), targets);
  console.log(JSON.stringify(preflight, null, 2));
  if (DRY_RUN) return;

  const health = await fetch(`${API_BASE}/api/health`);
  if (!health.ok) throw new Error('本地服务未启动或不可用。');

  const runRows = [];
  let totalUsageUsd = 0;
  let stoppedByBudget = false;
  for (const platform of PLATFORM_ORDER) {
    if (SELECTED_PLATFORM && platform !== SELECTED_PLATFORM) continue;
    const platformTargets = targets.filter((row) => row.platform === platform);
    for (const [batchIndex, batchRows] of chunk(platformTargets, BATCH_SIZE).entries()) {
      if (MAX_RUN_USAGE_USD > 0 && totalUsageUsd >= MAX_RUN_USAGE_USD) {
        stoppedByBudget = true;
        break;
      }
      const urls = batchRows.map((row) => row.profileUrl).filter(Boolean);
      const startedAt = new Date().toISOString();
      try {
        const result = await callLocalDiscover({ platform, urls, maxItems: PLATFORM_MAX_ITEMS[platform] });
        const usageUsd = Number(result.summary?.usageUsd || 0);
        totalUsageUsd += usageUsd;
        runRows.push({
          platform,
          batch: batchIndex + 1,
          targets: urls.length,
          status: result.status || 'success',
          processedInfluencers: result.processedInfluencers || 0,
          scraped: result.summary?.scraped || 0,
          matched: result.summary?.matched || 0,
          videoCreated: result.summary?.videoCreated || 0,
          videoSkipped: result.summary?.videoSkipped || 0,
          snapshotCreated: result.summary?.snapshotCreated || 0,
          usageUsd,
          totalUsageUsd: Number(totalUsageUsd.toFixed(6)),
          startedAt,
          finishedAt: new Date().toISOString(),
          error: ''
        });
      } catch (error) {
        runRows.push({
          platform,
          batch: batchIndex + 1,
          targets: urls.length,
          status: 'failed',
          processedInfluencers: 0,
          scraped: 0,
          matched: 0,
          videoCreated: 0,
          videoSkipped: 0,
          snapshotCreated: 0,
          usageUsd: 0,
          totalUsageUsd: Number(totalUsageUsd.toFixed(6)),
          startedAt,
          finishedAt: new Date().toISOString(),
          error: error.message
        });
        if (/not-enough|usage|402|billing|exceed/i.test(error.message)) {
          stoppedByBudget = true;
          break;
        }
      }
      await writeCsv(path.join(REPORT_DIR, `crawl-run-log-${SELECTED_PLATFORM || 'all'}.csv`), runRows);
    }
    if (stoppedByBudget) break;
  }

  const summary = {
    ...preflight,
    finishedAt: new Date().toISOString(),
    totalUsageUsd: Number(totalUsageUsd.toFixed(6)),
    stoppedByBudget,
    runBatches: runRows.length,
    createdVideos: runRows.reduce((sum, row) => sum + Number(row.videoCreated || 0), 0),
    matchedPosts: runRows.reduce((sum, row) => sum + Number(row.matched || 0), 0),
    errors: runRows.filter((row) => row.status === 'failed').length
  };
  await writeJson(path.join(REPORT_DIR, `crawl-summary-${SELECTED_PLATFORM || 'all'}.json`), summary);
  await writeCsv(path.join(REPORT_DIR, `crawl-run-log-${SELECTED_PLATFORM || 'all'}.csv`), runRows);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
