import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const LOCAL_DIR = path.join(ROOT, 'data', 'local');
const REPORT_DIR = path.join(ROOT, 'data', 'reports', 'weekly-crawl-2026-06-28_2026-07-04');
const API_BASE = process.env.LOCAL_API_BASE || 'http://127.0.0.1:3000';
const WEEK_START = new Date('2026-06-27T16:00:00.000Z'); // 2026-06-28 00:00 Asia/Shanghai
const WEEK_END = new Date('2026-07-04T16:00:00.000Z'); // 2026-07-05 00:00 Asia/Shanghai
const OWNERS = new Set(['ryan', 'stefan']);
const PLATFORM_ORDER = ['youtubevideo', 'youtubeshort', 'instagramreels', 'tiktok'];
const PLATFORM_MAX_ITEMS = {
  youtubevideo: 7,
  youtubeshort: 20,
  instagramreels: 20,
  tiktok: 20
};

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const SELECTED_PLATFORM = [...args].find((arg) => arg.startsWith('--platform='))?.split('=')[1] || '';
const MAX_TARGETS = Number([...args].find((arg) => arg.startsWith('--max-targets='))?.split('=')[1] || 0);
const BATCH_SIZE = Math.max(1, Number([...args].find((arg) => arg.startsWith('--batch-size='))?.split('=')[1] || process.env.CRAWL_BATCH_SIZE || 5));
const MAX_RUN_USAGE_USD = Number([...args].find((arg) => arg.startsWith('--budget-usd='))?.split('=')[1] || process.env.MAX_RUN_USAGE_USD || 0);
const SKIP_CHECKED_AFTER = [...args].find((arg) => arg.startsWith('--skip-checked-after='))?.split('=')[1] || '';

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') return String(value.text || value.link || value.value || '').trim();
  return String(value).trim();
}

function link(value) {
  return text(value);
}

function normalizePlatform(value) {
  const raw = text(value).toLowerCase().replace(/\s+/g, '');
  if (raw.includes('instagram')) return 'instagramreels';
  if (raw.includes('tiktok')) return 'tiktok';
  if (raw.includes('youtube') && raw.includes('short')) return 'youtubeshort';
  if (raw.includes('youtube')) return 'youtubevideo';
  return raw;
}

function normalizeCreator(value) {
  return text(value)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '');
}

function parseCoopDate(value) {
  const raw = text(value).slice(0, 10);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTimestamp(value) {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeUrl(value) {
  const raw = link(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    url.hash = '';
    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      const videoId = url.searchParams.get('v') || '';
      url.search = videoId ? `?v=${videoId}` : '';
    } else {
      url.search = '';
    }
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().toLowerCase();
  } catch {
    return raw.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
  }
}

function csvEscape(value) {
  const output = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(output) ? `"${output.replace(/"/g, '""')}"` : output;
}

async function readJsonArray(name) {
  try {
    const rows = JSON.parse(await fs.readFile(path.join(LOCAL_DIR, name), 'utf8'));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
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

async function collectCheckedProfileKeys(platform, sinceIso) {
  const since = sinceIso ? new Date(sinceIso) : null;
  if (since && Number.isNaN(since.getTime())) return new Set();
  const outputDir = path.join(ROOT, 'data', 'output');
  const checked = new Set();
  let files = [];
  try {
    files = await fs.readdir(outputDir);
  } catch {
    return checked;
  }
  for (const file of files) {
    if (!file.includes(`_${platform}_`) || !file.endsWith('_summary.json')) continue;
    const filePath = path.join(outputDir, file);
    if (since) {
      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat || stat.mtime < since) continue;
    }
    try {
      const summary = JSON.parse(await fs.readFile(filePath, 'utf8'));
      if (summary.error) continue;
      const input = normalizeUrl(summary.influencerInput);
      if (input) checked.add(input);
    } catch {}
  }
  return checked;
}

function buildWeekVideoKeys(videos) {
  const keys = new Set();
  for (const row of videos) {
    const fields = row.fields || row;
    const date = parseTimestamp(fields.timestamp);
    if (!date || date < WEEK_START || date >= WEEK_END) continue;
    const creator = normalizeCreator(fields['红人名称']);
    const platform = normalizePlatform(fields['平台']);
    if (creator && platform) keys.add(`${creator}__${platform}`);
  }
  return keys;
}

function buildTargets(influencers, videos) {
  const weekVideoKeys = buildWeekVideoKeys(videos);
  const skipNew = [];
  const missingLink = [];
  const alreadyUpdated = [];
  const targets = [];
  const seen = new Set();

  for (const row of influencers) {
    const fields = row.fields || row;
    const owner = text(fields['负责人']);
    const platform = normalizePlatform(fields['平台']);
    const creator = text(fields['红人名称']);
    const creatorKey = normalizeCreator(creator);
    const profileUrl = link(fields['红人链接']);
    const profileKey = normalizeUrl(profileUrl);
    const coopDate = parseCoopDate(fields['合作日期']);
    const monitorText = text(fields['是否监控']);

    if (!OWNERS.has(owner.toLowerCase())) continue;
    if (monitorText === '否') continue;
    if (!PLATFORM_ORDER.includes(platform)) continue;
    if (!creatorKey && !profileUrl) continue;

    const base = {
      id: row.id || '',
      owner,
      creator,
      code: text(fields['红人编码']),
      region: text(fields['地区']) || text(fields['红人编码']).split('-')[0],
      platform,
      profileUrl,
      coopDate: coopDate ? text(fields['合作日期']).slice(0, 10) : '',
      expectedVideo: text(fields['预计视频交付']),
      completedVideo: text(fields['已上线视频'])
    };

    if (coopDate && coopDate >= WEEK_START && coopDate < WEEK_END) {
      skipNew.push({ ...base, reason: '上周期新合作，按规则本轮只登记不抓取' });
      continue;
    }
    if (!profileUrl) {
      missingLink.push({ ...base, reason: '缺主页链接，无法进入 Apify' });
      continue;
    }
    if (weekVideoKeys.has(`${creatorKey}__${platform}`)) {
      alreadyUpdated.push({ ...base, reason: '本地已有上周期上线视频记录' });
      continue;
    }

    const dedupKey = `${platform}__${profileKey || creatorKey}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    targets.push({ ...base, maxItems: PLATFORM_MAX_ITEMS[platform], reason: '老合作且缺上周期平台视频记录，需要检查' });
  }

  return { targets, skipNew, missingLink, alreadyUpdated };
}

async function callLocalDiscover({ platform, urls, maxItems }) {
  const payload = {
    days: 7,
    maxItems,
    globalKeywords: 'yozma,yozmasport,IN10,IN 10,IN-10',
    limitInfluencers: Math.max(1, urls.length + 10),
    skipInfluencers: 0,
    onlyInfluencerInputs: urls,
    platformFilter: platform,
    publishedBefore: WEEK_END.toISOString(),
    actorLookbackDays: 8,
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

function chunk(rows, size) {
  const output = [];
  for (let i = 0; i < rows.length; i += size) output.push(rows.slice(i, i + size));
  return output;
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const influencers = await readJsonArray('influencers.json');
  const videos = await readJsonArray('videos.json');
  const { targets, skipNew, missingLink, alreadyUpdated } = buildTargets(influencers, videos);
  const checkedKeys = SELECTED_PLATFORM && SKIP_CHECKED_AFTER ? await collectCheckedProfileKeys(SELECTED_PLATFORM, SKIP_CHECKED_AFTER) : new Set();
  const filteredTargets = targets
    .filter((row) => (SELECTED_PLATFORM ? row.platform === SELECTED_PLATFORM : true))
    .filter((row) => !checkedKeys.has(normalizeUrl(row.profileUrl)))
    .slice(0, MAX_TARGETS > 0 ? MAX_TARGETS : undefined);

  const preflight = {
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    week: { start: '2026-06-28', endExclusive: '2026-07-05' },
    owners: [...OWNERS],
    platformMaxItems: PLATFORM_MAX_ITEMS,
    totals: {
      targets: filteredTargets.length,
      skipNew: skipNew.length,
      missingLink: missingLink.length,
      alreadyUpdated: alreadyUpdated.length
    },
    skippedCheckedThisRun: checkedKeys.size,
    targetByPlatform: filteredTargets.reduce((acc, row) => {
      acc[row.platform] = (acc[row.platform] || 0) + 1;
      return acc;
    }, {})
  };

  await writeJson(path.join(REPORT_DIR, 'preflight-summary.json'), preflight);
  await writeCsv(path.join(REPORT_DIR, 'targets-to-crawl.csv'), filteredTargets);
  await writeCsv(path.join(REPORT_DIR, 'skipped-new-cooperations.csv'), skipNew);
  await writeCsv(path.join(REPORT_DIR, 'already-updated.csv'), alreadyUpdated);
  await writeCsv(path.join(REPORT_DIR, 'missing-profile-links.csv'), missingLink);
  console.log(JSON.stringify(preflight, null, 2));

  if (DRY_RUN) return;

  const health = await fetch(`${API_BASE}/api/health`);
  if (!health.ok) throw new Error('本地服务未启动或不可用。');

  const runRows = [];
  let totalUsageUsd = 0;
  let stoppedByBudget = false;
  for (const platform of PLATFORM_ORDER) {
    if (SELECTED_PLATFORM && platform !== SELECTED_PLATFORM) continue;
    const platformTargets = filteredTargets.filter((row) => row.platform === platform);
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
      await writeCsv(path.join(REPORT_DIR, 'crawl-run-log.csv'), runRows);
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
  await writeJson(path.join(REPORT_DIR, 'crawl-summary.json'), summary);
  await writeCsv(path.join(REPORT_DIR, 'crawl-run-log.csv'), runRows);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
