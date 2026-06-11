import fs from 'node:fs/promises';

const baseUrl = 'http://127.0.0.1:3000';
const outputPath = `data/reports/p2-tiktok-day9-max25-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const startedAt = new Date().toISOString();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function text(value) {
  if (!value) return '';
  if (typeof value === 'object') return value.link || value.text || '';
  return String(value);
}

function normalizeUrl(value) {
  const raw = text(value).trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    url.hash = '';
    url.search = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/$/, '');
  }
}

function isMonitorEnabled(value) {
  return String(value || '').trim() === '是';
}

function isTikTok(fields) {
  const platform = String(fields['平台'] || '').toLowerCase();
  const url = text(fields['红人链接']).toLowerCase();
  return platform.includes('tiktok') || url.includes('tiktok.com');
}

function shouldRetry(errorText = '') {
  return errorText.includes('已有本地抓取任务正在运行') || errorText.includes('fetch failed') || errorText.includes('network');
}

function summarize(results) {
  const summary = {
    total: results.length,
    success: 0,
    failed: 0,
    usageUsd: 0,
    videoCreated: 0,
    videoSkipped: 0,
    snapshotCreated: 0,
    scraped: 0,
    matched: 0
  };
  for (const result of results) {
    if (result.ok) summary.success += 1;
    else summary.failed += 1;
    const runSummary = result.data?.summary || {};
    summary.usageUsd += Number(runSummary.usageUsd || 0);
    summary.videoCreated += Number(runSummary.videoCreated || 0);
    summary.videoSkipped += Number(runSummary.videoSkipped || 0);
    summary.snapshotCreated += Number(runSummary.snapshotCreated || 0);
    summary.scraped += Number(runSummary.scraped || 0);
    summary.matched += Number(runSummary.matched || 0);
  }
  summary.usageUsd = Number(summary.usageUsd.toFixed(6));
  return summary;
}

async function saveProgress(results, done = false) {
  const report = {
    done,
    startedAt,
    updatedAt: new Date().toISOString(),
    parameters: { platform: 'tiktok', priority: 'P2 低频追踪', days: 9, maxItems: 25 },
    summary: summarize(results),
    results
  };
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  return report;
}

async function runOne(row) {
  const payload = {
    dryRun: false,
    days: 9,
    maxItems: 25,
    limitInfluencers: 1,
    skipInfluencers: 0,
    platformFilter: 'tiktok',
    onlyInfluencerInputs: [row.homeUrl],
    globalKeywords: 'yozma,yozmasport,in10'
  };
  const attempts = [];
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const started = new Date().toISOString();
    try {
      const response = await fetch(`${baseUrl}/api/local/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      const error = data.error || data.message || (response.ok ? '' : `HTTP ${response.status}`);
      attempts.push({ attempt, startedAt: started, finishedAt: new Date().toISOString(), status: response.status, error });
      if (response.ok && data.ok !== false) return { ok: true, status: response.status, data, attempts };
      if (!shouldRetry(error)) return { ok: false, status: response.status, data, error, attempts };
    } catch (error) {
      const message = error?.message || String(error);
      attempts.push({ attempt, startedAt: started, finishedAt: new Date().toISOString(), error: message });
      if (!shouldRetry(message)) return { ok: false, error: message, attempts };
    }
    await wait(15000 * attempt);
  }
  return { ok: false, error: attempts.at(-1)?.error || 'retry exhausted', attempts };
}

const influencers = JSON.parse(await fs.readFile('data/local/influencers.json', 'utf8'));
const previous = JSON.parse(await fs.readFile('data/reports/incremental-tiktok-run-2026-06-07T08-16-26-240Z.json', 'utf8'));
const previousUrls = new Set(previous.results.filter((row) => row.ok).map((row) => normalizeUrl(row.homeUrl)));

const rows = influencers
  .map((row) => ({ id: row.id, fields: row.fields || row }))
  .filter(({ fields }) => isMonitorEnabled(fields['是否监控']))
  .filter(({ fields }) => fields['追踪优先级'] === 'P2 低频追踪')
  .filter(({ fields }) => isTikTok(fields))
  .map(({ id, fields }) => ({
    id,
    creator: String(fields['红人名称'] || '').trim(),
    priority: fields['追踪优先级'],
    homeUrl: text(fields['红人链接'])
  }))
  .filter((row) => row.homeUrl && !previousUrls.has(normalizeUrl(row.homeUrl)));

const results = [];
console.log(JSON.stringify({ event: 'p2-tiktok-start', outputPath, queued: rows.length, parameters: { days: 9, maxItems: 25 } }));

for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  const result = {
    index: index + 1,
    total: rows.length,
    creator: row.creator,
    priority: row.priority,
    platform: 'tiktok',
    homeUrl: row.homeUrl,
    startedAt: new Date().toISOString()
  };
  const run = await runOne(row);
  Object.assign(result, run, { finishedAt: new Date().toISOString() });
  results.push(result);
  const runSummary = result.data?.summary || {};
  console.log(JSON.stringify({
    event: 'p2-tiktok-progress',
    index: result.index,
    total: result.total,
    creator: result.creator,
    ok: result.ok,
    usageUsd: Number(runSummary.usageUsd || 0),
    videoCreated: Number(runSummary.videoCreated || 0),
    videoSkipped: Number(runSummary.videoSkipped || 0),
    error: result.error || ''
  }));
  if (index % 5 === 0 || !result.ok) await saveProgress(results);
}

const finalReport = await saveProgress(results, true);
console.log(JSON.stringify({ event: 'p2-tiktok-done', outputPath, summary: finalReport.summary }));
