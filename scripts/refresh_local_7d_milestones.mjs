import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const VIDEOS_PATH = path.join(ROOT, 'data/local/videos.json');
const SNAPSHOTS_PATH = path.join(ROOT, 'data/local/snapshots.json');
const RAW_DIR = path.join(ROOT, 'data/raw');
const REPORT_DIR = path.join(ROOT, 'data/reports');
const MILESTONE_MODES = new Set(String(process.env.MILESTONE_MODES || '7').split(',').map((item) => item.trim()).filter(Boolean));
const DRY_RUN = process.argv.includes('--dry-run');
const RUN_TAG = `local-${[...MILESTONE_MODES].join('-') || '7'}d-milestone-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const RUN_ID = `local_${[...MILESTONE_MODES].join('_') || '7'}d_${Date.now()}`;
const REPORT_PATH = path.join(REPORT_DIR, `${RUN_TAG}.json`);

const PLATFORMS = new Set(['instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok']);

function readEnvFile(text) {
  const env = {};
  for (const line of String(text || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

async function getApifyToken() {
  if (process.env.APIFY_API_TOKEN) return process.env.APIFY_API_TOKEN;
  try {
    const env = readEnvFile(await fs.readFile(path.join(ROOT, '.env'), 'utf8'));
    return env.APIFY_API_TOKEN || '';
  } catch {
    return '';
  }
}

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') return value.link || value.text || '';
  return String(value);
}

function readLinkCell(value) {
  return text(value).trim();
}

function normalizePlatform(value) {
  const s = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('instagram')) return 'instagramreels';
  if (s.includes('youtube') && s.includes('short')) return 'youtubeshort';
  if (s.includes('youtube')) return 'youtubevideo';
  return s;
}

function normalizePostUrl(rawUrl) {
  const s = readLinkCell(rawUrl);
  if (!s) return '';
  try {
    const u = new URL(s);
    u.hash = '';
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') {
      const v = u.searchParams.get('v') || '';
      u.search = v ? `?v=${v}` : '';
    } else {
      u.search = '';
    }
    const cleanPath = u.pathname.replace(/\/+$/, '');
    return `${u.protocol}//${u.host}${cleanPath}${u.search}`.toLowerCase();
  } catch {
    return s.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/+$/, '').toLowerCase();
  }
}

function toNumber(value, defaultValue = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'object' && value !== null) return toNumber(value.text ?? value.value ?? value.link, defaultValue);
  const cleaned = String(value ?? '').replace(/,/g, '').trim();
  if (!cleaned) return defaultValue;
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return defaultValue;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : defaultValue;
}

function parseDateSafe(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const n = Number(value);
    const d = new Date(n > 10000000000 ? n : n * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function pick(obj, paths, fallback = '') {
  for (const keyPath of paths) {
    const parts = String(keyPath).split('.');
    let cur = obj;
    for (const part of parts) {
      if (cur == null || typeof cur !== 'object' || !(part in cur)) {
        cur = undefined;
        break;
      }
      cur = cur[part];
    }
    if (cur !== undefined && cur !== null && cur !== '') return cur;
  }
  return fallback;
}

function buildDetailActorInput({ targets, maxItems = 50 }) {
  const cleanedTargets = [...new Set((targets || []).map((t) => String(t || '').trim()).filter(Boolean))];
  return {
    username: cleanedTargets,
    directUrls: cleanedTargets,
    startUrls: cleanedTargets.map((url) => ({ url })),
    userUrls: cleanedTargets,
    resultsLimit: Math.max(1, Number(maxItems) || 50),
    skipPinnedPosts: false,
    includeSharesCount: false,
    includeTranscript: false,
    includeDownloadedVideo: false
  };
}

function buildMilestoneActorRequest(platform, targets) {
  const uniqueTargets = [...new Set((targets || []).map((value) => String(value || '').trim()).filter(Boolean))];
  if (platform === 'tiktok') {
    return {
      actorId: 'S5h7zRLfKFEr8pdj7',
      actorInput: {
        postURLs: uniqueTargets,
        resultsPerPage: Math.max(1, uniqueTargets.length),
        commentsPerPost: 0,
        shouldDownloadVideos: false,
        downloadSubtitlesOptions: 'NEVER_DOWNLOAD_SUBTITLES'
      }
    };
  }
  if (platform === 'youtubevideo' || platform === 'youtubeshort') {
    return {
      actorId: 'h7sDV53CddomktSi5',
      actorInput: {
        startUrls: uniqueTargets.map((url) => ({ url })),
        maxResults: Math.max(1, uniqueTargets.length),
        maxResultsShorts: Math.max(1, uniqueTargets.length),
        maxResultStreams: 0,
        downloadSubtitles: false,
        saveSubsToKVS: false
      }
    };
  }
  return {
    actorId: 'xMc5Ga1oCONPmWJIa',
    actorInput: buildDetailActorInput({ targets: uniqueTargets, maxItems: uniqueTargets.length })
  };
}

function normalizeMilestoneItem(platform, item) {
  if (platform === 'tiktok') {
    return {
      platform,
      creatorUsername: pick(item, ['authorMeta.name', 'author.uniqueId', 'authorUsername', 'username']),
      creatorFollowersCount: toNumber(pick(item, ['authorMeta.fans', 'author.stats.followerCount', 'author.followerCount', 'followerCount'])),
      postId: String(pick(item, ['id', 'awemeId', 'videoId'])),
      postUrl: pick(item, ['webVideoUrl', 'url', 'videoUrl']),
      caption: pick(item, ['text', 'desc', 'caption', 'description']),
      commentsCount: toNumber(pick(item, ['commentCount', 'stats.commentCount', 'commentsCount'])),
      likesCount: toNumber(pick(item, ['diggCount', 'stats.diggCount', 'likesCount', 'likes'])),
      videoViewCount: toNumber(pick(item, ['playCount', 'stats.playCount', 'videoViewCount', 'views'])),
      videoPlayCount: toNumber(pick(item, ['playCount', 'stats.playCount', 'videoPlayCount', 'views'])),
      sharesCount: toNumber(pick(item, ['shareCount', 'stats.shareCount', 'sharesCount'])),
      videoUrl: pick(item, ['videoUrl', 'videoMeta.downloadAddr', 'webVideoUrl']),
      coverImage: pick(item, ['covers.default', 'videoMeta.coverUrl', 'coverImage'])
    };
  }
  if (platform === 'youtubevideo' || platform === 'youtubeshort') {
    const title = pick(item, ['title', 'name']);
    const description = pick(item, ['description', 'text']);
    return {
      platform,
      creatorUsername: pick(item, ['channelName', 'authorName', 'ownerUsername']),
      creatorFollowersCount: toNumber(pick(item, ['numberOfSubscribers', 'subscriberCount', 'subscribers', 'channelSubscriberCount', 'authorSubscriberCount'])),
      postId: String(pick(item, ['id', 'videoId'])),
      postUrl: pick(item, ['url', 'videoUrl', 'webpageUrl']),
      caption: `${title}${description ? `\n${description}` : ''}`.trim(),
      commentsCount: toNumber(pick(item, ['commentsCount', 'comments', 'numberOfComments'])),
      likesCount: toNumber(pick(item, ['likesCount', 'likes', 'numberOfLikes'])),
      videoViewCount: toNumber(pick(item, ['videoViewCount', 'views', 'viewCount', 'numberOfViews'])),
      videoPlayCount: toNumber(pick(item, ['videoPlayCount', 'views', 'viewCount', 'numberOfViews'])),
      sharesCount: 0,
      videoUrl: pick(item, ['url', 'videoUrl']),
      coverImage: pick(item, ['thumbnailUrl', 'thumbnail'])
    };
  }
  return {
    platform,
    creatorUsername: pick(item, ['creatorUsername', 'ownerUsername', 'authorUsername', 'username', 'authorMeta.name', 'user.username']),
    creatorFollowersCount: toNumber(pick(item, ['followersCount', 'followerCount', 'ownerFollowersCount', 'authorMeta.fans', 'user.followers'])),
    postId: String(pick(item, ['postId', 'id', 'awemeId', 'shortCode'])),
    postUrl: pick(item, ['postUrl', 'url', 'videoUrl', 'webVideoUrl', 'permalink']),
    caption: pick(item, ['caption', 'text', 'description', 'title']),
    commentsCount: toNumber(pick(item, ['commentsCount', 'commentCount', 'comments_count'])),
    likesCount: toNumber(pick(item, ['likesCount', 'likeCount', 'likes', 'diggCount'])),
    videoViewCount: toNumber(pick(item, ['videoViewCount', 'viewCount', 'views', 'video.viewCount', 'videoPlayCount', 'playCount', 'plays'])),
    videoPlayCount: toNumber(pick(item, ['videoPlayCount', 'playCount', 'plays', 'video.playCount', 'videoViewCount', 'viewCount', 'views'])),
    sharesCount: toNumber(pick(item, ['sharesCount', 'shareCount', 'shares'])),
    videoUrl: pick(item, ['videoUrl', 'video.downloadAddr', 'video.playAddr']),
    coverImage: pick(item, ['coverImage', 'cover', 'thumbnail', 'video.cover'])
  };
}

function findMilestoneItem(platform, items, targetUrl) {
  const normalizedTarget = normalizePostUrl(targetUrl);
  const rows = (items || []).map((item) => ({ item, cleaned: normalizeMilestoneItem(platform, item) }));
  return rows.find(({ cleaned }) => normalizePostUrl(cleaned.postUrl) === normalizedTarget) || (rows.length === 1 ? rows[0] : null);
}

async function runApifyActor({ apiToken, actorId, actorInput }) {
  const runUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(apiToken)}&waitForFinish=300`;
  const runRes = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actorInput)
  });
  if (!runRes.ok) {
    const detail = await runRes.text();
    throw new Error(`Apify actor run failed: ${runRes.status} ${detail}`);
  }
  const runJson = await runRes.json();
  let runData = runJson.data || {};
  const runId = runData.id;
  const datasetId = runData.defaultDatasetId;
  if (!datasetId) throw new Error('Apify returned no datasetId.');

  const terminal = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);
  for (let i = 0; i < 120 && !terminal.has(String(runData.status || '').toUpperCase()); i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(apiToken)}`);
    if (statusRes.ok) runData = (await statusRes.json()).data || runData;
  }
  if (!terminal.has(String(runData.status || '').toUpperCase())) throw new Error(`Apify run still not finished: ${runId}`);
  if (String(runData.status || '').toUpperCase() !== 'SUCCEEDED') throw new Error(`Apify run ${runId} ended with ${runData.status}`);

  const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(apiToken)}&clean=true`);
  if (!itemsRes.ok) throw new Error(`Apify dataset fetch failed: ${itemsRes.status} ${await itemsRes.text()}`);
  const items = await itemsRes.json();
  return { runData, datasetId, items: Array.isArray(items) ? items : [] };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function findReusableRaw(platform, expectedCount, currentRawPath) {
  if (process.env.REUSE_RAW !== '1') return null;
  const current = await readJsonIfExists(currentRawPath);
  if (current) return { raw: current, rawPath: currentRawPath };
  try {
    const names = await fs.readdir(RAW_DIR);
    const candidates = names
      .filter((name) => name.includes('d-milestone-') && name.endsWith(`_${platform}_raw.json`))
      .sort()
      .reverse();
    for (const name of candidates) {
      const rawPath = path.join(RAW_DIR, name);
      const raw = await readJsonIfExists(rawPath);
      const inputCount = raw?.meta?.actorInput?.postURLs?.length
        ?? raw?.meta?.actorInput?.startUrls?.length
        ?? raw?.meta?.actorInput?.directUrls?.length
        ?? raw?.meta?.actorInput?.username?.length
        ?? 0;
      if (inputCount === expectedCount) return { raw, rawPath };
    }
  } catch {
    return null;
  }
  return null;
}

function isMonitorEnabled(value) {
  return String(value || '').trim() === '是';
}

function postKeyOf(platform, fields) {
  const postId = String(fields.id || '').trim();
  const url = readLinkCell(fields.url);
  return postId ? `${platform}_${postId}` : `${platform}_${url}`;
}

function latestSnapshotsByPostKey(snapshots) {
  const latest = new Map();
  const types = new Map();
  const snapshotsByKey = new Map();
  for (const snapshot of snapshots) {
    const fields = snapshot.fields || snapshot;
    const key = String(fields.postKey || '').trim();
    if (!key) continue;
    if (!snapshotsByKey.has(key)) snapshotsByKey.set(key, []);
    const type = String(fields.snapshotType || '').trim();
    if (!types.has(key)) types.set(key, new Set());
    if (type) types.get(key).add(type);
    const capturedAt = toNumber(fields.capturedAt, 0);
    const views = Math.max(toNumber(fields.videoPlayCount, 0), toNumber(fields.videoViewCount, 0));
    snapshotsByKey.get(key).push({ capturedAt, views, fields });
    const previous = latest.get(key);
    if (!previous || capturedAt >= previous.capturedAt) latest.set(key, { capturedAt, fields });
  }
  for (const rows of snapshotsByKey.values()) rows.sort((a, b) => b.capturedAt - a.capturedAt);
  return { latest, types, snapshotsByKey };
}

await fs.mkdir(REPORT_DIR, { recursive: true });
await fs.mkdir(RAW_DIR, { recursive: true });

const videos = JSON.parse(await fs.readFile(VIDEOS_PATH, 'utf8'));
const snapshots = JSON.parse(await fs.readFile(SNAPSHOTS_PATH, 'utf8'));
const { latest, types, snapshotsByKey } = latestSnapshotsByPostKey(snapshots);
const now = new Date();

const due = [];
const backfillable7d = [];
for (const video of videos) {
  const fields = video.fields || video;
  const platform = normalizePlatform(fields['平台'] || fields.platform);
  const url = readLinkCell(fields.url);
  const publishedAt = parseDateSafe(fields.timestamp);
  if (!PLATFORMS.has(platform) || !url || !publishedAt || !isMonitorEnabled(fields['是否监控'])) continue;
  const key = postKeyOf(platform, fields);
  const ageDays = (now.getTime() - publishedAt.getTime()) / 86400000;
  const snapshotTypes = types.get(key) || new Set();
  const existingAfter7d = (snapshotsByKey.get(key) || [])
    .filter((snapshot) => (
      snapshot.views > 0
      && snapshot.capturedAt >= publishedAt.getTime() + 7 * 86400000
      && snapshot.capturedAt < publishedAt.getTime() + 30 * 86400000
    ))
    .sort((a, b) => (
      Math.abs(a.capturedAt - (publishedAt.getTime() + 7 * 86400000))
      - Math.abs(b.capturedAt - (publishedAt.getTime() + 7 * 86400000))
    ))[0];
  let milestone = '';
  if (MILESTONE_MODES.has('30') && ageDays >= 30 && !snapshotTypes.has('milestone_30d')) {
    milestone = 'milestone_30d';
  } else if (MILESTONE_MODES.has('7') && ageDays >= 7 && ageDays < 30 && !snapshotTypes.has('milestone_7d')) {
    if (existingAfter7d) {
      backfillable7d.push({ video, fields, platform, url, key, publishedAt, ageDays, snapshot: existingAfter7d });
    } else {
      milestone = 'milestone_7d';
    }
  }
  if (milestone) {
    due.push({ video, fields, platform, url, key, publishedAt, ageDays, milestone });
  }
}

const grouped = new Map();
for (const item of due) {
  if (!grouped.has(item.platform)) grouped.set(item.platform, []);
  grouped.get(item.platform).push(item);
}

const report = {
  ok: false,
  runId: RUN_ID,
  modes: [...MILESTONE_MODES],
  dryRun: DRY_RUN,
  startedAt: new Date().toISOString(),
  finishedAt: '',
  dueCount: due.length,
  backfillable7dCount: backfillable7d.length,
  backfilledExistingSnapshot: 0,
  dueByPlatform: Object.fromEntries([...grouped].map(([platform, rows]) => [platform, rows.length])),
  usageUsd: 0,
  updated: 0,
  notFound: 0,
  errors: [],
  platformRuns: [],
  outputFiles: { report: REPORT_PATH }
};

console.log(JSON.stringify({ event: 'local-milestone-start', modes: [...MILESTONE_MODES], dueCount: due.length, backfillable7dCount: backfillable7d.length, dueByPlatform: report.dueByPlatform, reportPath: REPORT_PATH }));

if (DRY_RUN) {
  report.ok = true;
  report.finishedAt = new Date().toISOString();
  report.due = due.map((item) => ({
    platform: item.platform,
    creator: text(item.fields['红人名称']),
    url: item.url,
    publishedAt: item.publishedAt.toISOString(),
    ageDays: Number(item.ageDays.toFixed(1)),
    milestone: item.milestone
  }));
  report.backfillable7d = backfillable7d.map((item) => ({
    platform: item.platform,
    creator: text(item.fields['红人名称']),
    url: item.url,
    publishedAt: item.publishedAt.toISOString(),
    capturedAt: new Date(item.snapshot.capturedAt).toISOString(),
    capturedAgeDays: Number(((item.snapshot.capturedAt - item.publishedAt.getTime()) / 86400000).toFixed(2)),
    views: item.snapshot.views
  }));
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ event: 'local-milestone-dry-run', reportPath: REPORT_PATH, summary: report }));
  process.exit(0);
}

const apiToken = await getApifyToken();
if (!apiToken) {
  throw new Error('缺少 APIFY_API_TOKEN，无法刷新成熟声量快照。');
}

if (due.length || backfillable7d.length) {
  const videoBackup = path.join(ROOT, `data/local/videos.backup-before-milestone-refresh-${RUN_TAG}.json`);
  const snapshotBackup = path.join(ROOT, `data/local/snapshots.backup-before-milestone-refresh-${RUN_TAG}.json`);
  await fs.copyFile(VIDEOS_PATH, videoBackup);
  await fs.copyFile(SNAPSHOTS_PATH, snapshotBackup);
  report.outputFiles.videoBackup = videoBackup;
  report.outputFiles.snapshotBackup = snapshotBackup;
}

for (const item of backfillable7d) {
  const sourceFields = item.snapshot.fields || {};
  const capturedAt = item.snapshot.capturedAt;
  const milestoneViews = Math.max(toNumber(sourceFields.videoPlayCount, 0), toNumber(sourceFields.videoViewCount, 0));
  item.fields['7日成熟声量'] = milestoneViews;
  item.video.updatedAt = new Date().toISOString();
  const snapshotFields = {
    ...sourceFields,
    runId: RUN_ID,
    snapshotType: 'milestone_7d',
    milestoneSource: 'existing_snapshot_backfill',
    milestoneAgeDays: String(Number(((capturedAt - item.publishedAt.getTime()) / 86400000).toFixed(2)))
  };
  snapshots.push({
    id: `${RUN_ID}_backfill_${snapshots.length + 1}`,
    fields: snapshotFields,
    source: 'local',
    importedAt: new Date().toISOString()
  });
  latest.set(item.key, { capturedAt, fields: snapshotFields });
  if (!types.has(item.key)) types.set(item.key, new Set());
  types.get(item.key).add('milestone_7d');
  report.backfilledExistingSnapshot += 1;
}

for (const [platform, rows] of grouped) {
  const { actorId, actorInput } = buildMilestoneActorRequest(platform, rows.map((row) => row.url));
  const platformResult = {
    platform,
    actorId,
    inputCount: rows.length,
    outputCount: 0,
    usageUsd: 0,
    updated: 0,
    notFound: 0,
    rawPath: path.join(RAW_DIR, `${RUN_TAG}_${platform}_raw.json`)
  };
  try {
    console.log(JSON.stringify({ event: 'platform-start', platform, inputCount: rows.length, actorId }));
    const cached = await findReusableRaw(platform, rows.length, platformResult.rawPath);
    const run = cached?.raw
      ? {
          runData: cached.raw.meta?.runData || {},
          datasetId: cached.raw.meta?.datasetId || '',
          items: Array.isArray(cached.raw.items) ? cached.raw.items : []
        }
      : await runApifyActor({ apiToken, actorId, actorInput });
    if (cached?.raw) console.log(JSON.stringify({ event: 'platform-raw-reused', platform, rawPath: cached.rawPath }));
    platformResult.outputCount = run.items.length;
    platformResult.usageUsd = Number(run.runData?.usageTotalUsd || 0);
    report.usageUsd += platformResult.usageUsd;
    if (!cached?.raw) {
      await fs.writeFile(
        platformResult.rawPath,
        JSON.stringify({ meta: { actorId, actorInput, runData: run.runData, datasetId: run.datasetId }, items: run.items }, null, 2)
      );
    } else {
      platformResult.rawPath = cached.rawPath;
    }

    for (const item of rows) {
      const found = findMilestoneItem(platform, run.items, item.url);
      if (!found) {
        platformResult.notFound += 1;
        report.notFound += 1;
        continue;
      }
      const row = found.cleaned;
      const fields = item.fields;
      if (row.creatorUsername) fields['红人名称'] = String(row.creatorUsername).trim();
      if (row.postId) fields.id = String(row.postId).trim();
      fields.caption = String(row.caption || fields.caption || '').slice(0, 2000);
      fields.commentsCount = String(toNumber(row.commentsCount, fields.commentsCount || 0));
      fields.likesCount = String(toNumber(row.likesCount, fields.likesCount || 0));
      fields.videoViewCount = String(toNumber(row.videoViewCount, fields.videoViewCount || 0));
      fields.videoPlayCount = String(toNumber(row.videoPlayCount, fields.videoPlayCount || 0));
      const milestoneViews = Math.max(toNumber(fields.videoPlayCount, 0), toNumber(fields.videoViewCount, 0));
      if (item.milestone === 'milestone_7d') fields['7日成熟声量'] = milestoneViews;
      if (item.milestone === 'milestone_30d') fields['30日成熟声量'] = milestoneViews;
      if (row.videoUrl) fields.videoUrl = String(row.videoUrl).slice(0, 1000);
      if (row.coverImage) fields.displayUrl = String(row.coverImage).slice(0, 1000);
      item.video.updatedAt = new Date().toISOString();

      const key = postKeyOf(platform, fields);
      const previous = latest.get(item.key)?.fields || latest.get(key)?.fields || {};
      const capturedAt = Date.now();
      const play = toNumber(fields.videoPlayCount, 0);
      const view = toNumber(fields.videoViewCount, 0);
      const like = toNumber(fields.likesCount, 0);
      const comment = toNumber(fields.commentsCount, 0);
      const share = toNumber(row.sharesCount, 0);
      const snapshotFields = {
        runId: RUN_ID,
        capturedAt: String(capturedAt),
        platform,
        红人名称: fields['红人名称'] || '',
        postKey: key,
        postId: fields.id || '',
        postUrl: { text: item.url, link: item.url },
        isProductPost: '是',
        是否监控: fields['是否监控'] || '是',
        isFirstSeen: '否',
        snapshotType: item.milestone,
        firstSeenAt: String(toNumber(previous.firstSeenAt, item.publishedAt.getTime())),
        videoPlayCount: String(play),
        videoViewCount: String(view),
        likesCount: String(like),
        commentsCount: String(comment),
        sharesCount: String(share),
        playDelta: String(play - toNumber(previous.videoPlayCount, 0)),
        viewDelta: String(view - toNumber(previous.videoViewCount, 0)),
        likeDelta: String(like - toNumber(previous.likesCount, 0)),
        commentDelta: String(comment - toNumber(previous.commentsCount, 0)),
        shareDelta: String(share - toNumber(previous.sharesCount, 0))
      };
      snapshots.push({
        id: `${RUN_ID}_${snapshots.length + 1}`,
        fields: snapshotFields,
        source: 'local',
        importedAt: new Date().toISOString()
      });
      latest.set(key, { capturedAt, fields: snapshotFields });
      if (!types.has(key)) types.set(key, new Set());
      types.get(key).add(item.milestone);
      platformResult.updated += 1;
      report.updated += 1;
    }
    console.log(JSON.stringify({ event: 'platform-done', platform, ...platformResult }));
  } catch (error) {
    platformResult.error = error?.message || String(error);
    report.errors.push({ platform, error: platformResult.error });
    console.log(JSON.stringify({ event: 'platform-error', platform, error: platformResult.error }));
  }
  report.platformRuns.push(platformResult);
  report.usageUsd = Number(report.usageUsd.toFixed(6));
  await fs.writeFile(REPORT_PATH, JSON.stringify({ ...report, finishedAt: new Date().toISOString() }, null, 2));
}

if (report.updated > 0 || report.backfilledExistingSnapshot > 0) {
  await fs.writeFile(VIDEOS_PATH, JSON.stringify(videos, null, 2));
  await fs.writeFile(SNAPSHOTS_PATH, JSON.stringify(snapshots, null, 2));
}

report.ok = report.errors.length === 0;
report.finishedAt = new Date().toISOString();
report.usageUsd = Number(report.usageUsd.toFixed(6));
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ event: 'local-milestone-done', reportPath: REPORT_PATH, summary: report }));
