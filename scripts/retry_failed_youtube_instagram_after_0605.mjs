import fs from 'node:fs/promises';

const previousReportPath = 'data/reports/incremental-youtube-instagram-run-2026-06-07T07-08-39-430Z.json';
const outputPath = `data/reports/incremental-youtube-instagram-retry-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const baseUrl = 'http://127.0.0.1:3000';
const startedAt = new Date().toISOString();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    matched: 0,
    byPlatform: {}
  };
  for (const result of results) {
    const platform = result.platform || 'unknown';
    summary.byPlatform[platform] ||= { total: 0, success: 0, failed: 0, usageUsd: 0, videoCreated: 0, videoSkipped: 0 };
    const bucket = summary.byPlatform[platform];
    bucket.total += 1;
    if (result.ok) {
      summary.success += 1;
      bucket.success += 1;
    } else {
      summary.failed += 1;
      bucket.failed += 1;
    }
    const runSummary = result.data?.summary || {};
    const usageUsd = Number(runSummary.usageUsd || 0);
    summary.usageUsd += usageUsd;
    summary.videoCreated += Number(runSummary.videoCreated || 0);
    summary.videoSkipped += Number(runSummary.videoSkipped || 0);
    summary.snapshotCreated += Number(runSummary.snapshotCreated || 0);
    summary.scraped += Number(runSummary.scraped || 0);
    summary.matched += Number(runSummary.matched || 0);
    bucket.usageUsd += usageUsd;
    bucket.videoCreated += Number(runSummary.videoCreated || 0);
    bucket.videoSkipped += Number(runSummary.videoSkipped || 0);
  }
  summary.usageUsd = Number(summary.usageUsd.toFixed(6));
  for (const bucket of Object.values(summary.byPlatform)) bucket.usageUsd = Number(bucket.usageUsd.toFixed(6));
  return summary;
}

async function saveProgress(results, done = false) {
  const report = {
    done,
    startedAt,
    updatedAt: new Date().toISOString(),
    previousReportPath,
    parameters: { days: 3, maxItems: 10, retryFailedOnly: true },
    summary: summarize(results),
    results
  };
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  return report;
}

async function runOne(row) {
  const payload = {
    dryRun: false,
    days: 3,
    maxItems: 10,
    limitInfluencers: 1,
    skipInfluencers: 0,
    platformFilter: row.platform,
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

const previous = JSON.parse(await fs.readFile(previousReportPath, 'utf8'));
const failedRows = previous.results.filter((row) => !row.ok);
const results = [];
console.log(JSON.stringify({ event: 'start-retry', outputPath, queued: failedRows.length }));

for (let index = 0; index < failedRows.length; index += 1) {
  const source = failedRows[index];
  const result = {
    index: index + 1,
    total: failedRows.length,
    originalIndex: source.index,
    creator: source.creator,
    priority: source.priority,
    platform: source.platform,
    homeUrl: source.homeUrl,
    startedAt: new Date().toISOString()
  };
  const run = await runOne(source);
  Object.assign(result, run, { finishedAt: new Date().toISOString() });
  results.push(result);
  const runSummary = result.data?.summary || {};
  console.log(JSON.stringify({
    event: 'retry-progress',
    index: result.index,
    total: result.total,
    originalIndex: result.originalIndex,
    creator: result.creator,
    platform: result.platform,
    ok: result.ok,
    usageUsd: Number(runSummary.usageUsd || 0),
    videoCreated: Number(runSummary.videoCreated || 0),
    videoSkipped: Number(runSummary.videoSkipped || 0),
    error: result.error || ''
  }));
  if (index % 10 === 0 || !result.ok) await saveProgress(results);
}

const finalReport = await saveProgress(results, true);
console.log(JSON.stringify({ event: 'retry-done', outputPath, summary: finalReport.summary }));
