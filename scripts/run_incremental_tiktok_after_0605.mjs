import fs from 'node:fs/promises';

const queuePath = 'data/reports/incremental-crawl-queue-20260607-incremental-after0605.csv';
const outputPath = `data/reports/incremental-tiktok-run-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const baseUrl = 'http://127.0.0.1:3000';
const startedAt = new Date().toISOString();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    queuePath,
    parameters: { platform: 'tiktok', days: 9, maxItems: 30 },
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
    maxItems: 30,
    limitInfluencers: 1,
    skipInfluencers: 0,
    platformFilter: 'tiktok',
    onlyInfluencerInputs: [row['主页链接']],
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

const rows = parseCsv(await fs.readFile(queuePath, 'utf8')).filter(
  (row) => row['建议模式'] === '跑5月30日至今' && row['抓取平台'] === 'tiktok' && row['主页链接']
);
const results = [];
console.log(JSON.stringify({ event: 'tiktok-start', outputPath, queued: rows.length }));

for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  const result = {
    index: index + 1,
    total: rows.length,
    creator: row['红人名称'],
    priority: row['优先级'],
    platform: 'tiktok',
    homeUrl: row['主页链接'],
    startedAt: new Date().toISOString()
  };
  const run = await runOne(row);
  Object.assign(result, run, { finishedAt: new Date().toISOString() });
  results.push(result);
  const runSummary = result.data?.summary || {};
  console.log(JSON.stringify({
    event: 'tiktok-progress',
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
console.log(JSON.stringify({ event: 'tiktok-done', outputPath, summary: finalReport.summary }));
