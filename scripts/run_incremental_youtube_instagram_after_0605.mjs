import fs from 'node:fs/promises';

const queuePath = 'data/reports/incremental-crawl-queue-20260607-incremental-after0605.csv';
const outputPath = `data/reports/incremental-youtube-instagram-run-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const baseUrl = 'http://127.0.0.1:3000';
const targetPlatforms = new Set(['instagramreels', 'youtubevideo', 'youtubeshort']);

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
    const data = result.data || {};
    const runSummary = data.summary || {};
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
    queuePath,
    parameters: { days: 3, maxItems: 10, platforms: [...targetPlatforms] },
    summary: summarize(results),
    results
  };
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  return report;
}

const startedAt = new Date().toISOString();
const rows = parseCsv(await fs.readFile(queuePath, 'utf8')).filter(
  (row) => row['建议模式'] === '只补6月5日后' && targetPlatforms.has(row['抓取平台']) && row['主页链接']
);

const results = [];
console.log(JSON.stringify({ event: 'start', outputPath, queued: rows.length, byPlatform: rows.reduce((acc, row) => {
  acc[row['抓取平台']] = (acc[row['抓取平台']] || 0) + 1;
  return acc;
}, {}) }));

for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  const payload = {
    dryRun: false,
    days: 3,
    maxItems: 10,
    limitInfluencers: 1,
    skipInfluencers: 0,
    platformFilter: row['抓取平台'],
    onlyInfluencerInputs: [row['主页链接']],
    globalKeywords: 'yozma,yozmasport,in10'
  };
  const item = {
    index: index + 1,
    total: rows.length,
    creator: row['红人名称'],
    priority: row['优先级'],
    platform: row['抓取平台'],
    homeUrl: row['主页链接'],
    startedAt: new Date().toISOString(),
    ok: false
  };
  try {
    const response = await fetch(`${baseUrl}/api/local/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    item.finishedAt = new Date().toISOString();
    item.ok = response.ok && data.ok !== false;
    item.status = response.status;
    item.data = data;
    if (!item.ok) item.error = data.error || data.message || `HTTP ${response.status}`;
  } catch (error) {
    item.finishedAt = new Date().toISOString();
    item.error = error?.message || String(error);
  }
  results.push(item);
  const runSummary = item.data?.summary || {};
  console.log(JSON.stringify({
    event: 'progress',
    index: item.index,
    total: item.total,
    creator: item.creator,
    platform: item.platform,
    ok: item.ok,
    usageUsd: Number(runSummary.usageUsd || 0),
    videoCreated: Number(runSummary.videoCreated || 0),
    videoSkipped: Number(runSummary.videoSkipped || 0),
    error: item.error || ''
  }));
  if (index % 10 === 0 || !item.ok) await saveProgress(results);
}

const finalReport = await saveProgress(results, true);
console.log(JSON.stringify({ event: 'done', outputPath, summary: finalReport.summary }));
