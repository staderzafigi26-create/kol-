const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const dotenv = require('dotenv');
const dns = require('dns');
const {
  APIFY_BUDGET_POLICY,
  budgetStatus,
  canStartActor,
  createTikTokApproval,
  normalizeLedger,
  redactSecrets,
  verifyTikTokApproval
} = require('./lib/apify-budget');

dotenv.config();
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (Object.prototype.hasOwnProperty.call(body, 'apiToken')) {
    return res.status(400).json({
      ok: false,
      error: 'Apify Token 仅允许从服务端环境读取，请勿在浏览器请求中携带。'
    });
  }

  const legacyPaidPaths = new Set([
    '/api/workflow/fetch-post-details',
    '/api/workflow/run-once',
    '/api/workflow/sync-feishu'
  ]);
  const isUnbudgetedScrape = req.path === '/api/scrape-influencer' && body.useMockData !== true;
  if (req.method === 'POST' && (legacyPaidPaths.has(req.path) || isUnbudgetedScrape)) {
    return res.status(410).json({
      ok: false,
      error: '旧付费入口已停用，请使用带预算闸门的本地发现、里程碑或钉钉同步接口。'
    });
  }
  return next();
});
app.use(express.static(path.join(__dirname, 'public')));

const RAW_DIR = path.join(__dirname, 'data', 'raw');
const OUTPUT_DIR = path.join(__dirname, 'data', 'output');
const REPORT_DIR = path.join(__dirname, 'data', 'reports');
const DASHBOARD_CACHE_PATH = path.join(__dirname, 'data', 'cache', 'dashboard.json');
const LOCAL_DATA_DIR = path.join(__dirname, 'data', 'local');
const LOCAL_DATA_FILES = {
  influencers: path.join(LOCAL_DATA_DIR, 'influencers.json'),
  videos: path.join(LOCAL_DATA_DIR, 'videos.json'),
  snapshots: path.join(LOCAL_DATA_DIR, 'snapshots.json'),
  runs: path.join(LOCAL_DATA_DIR, 'runs.json'),
  affiliateSales: path.join(LOCAL_DATA_DIR, 'affiliate_sales.json')
};
const APIFY_BUDGET_PATH = path.join(LOCAL_DATA_DIR, 'apify-budget-ledger.json');
const CRM_MONITOR_TARGETS_PATH = process.env.YOZMA_CRM_VIDEO_TARGETS || '/Users/ryan/Library/Application Support/Yozma KOL CRM/state/video-monitor-targets.json';
const SYNC_SETTINGS_PATH = path.join(__dirname, '抓取设置.env');
let dingTalkMilestoneRefreshRunning = false;
let dingTalkSyncRunning = false;
let dingTalkDashboardCache = null;
let localDiscoveryRunning = false;
const APIFY_USAGE_ESTIMATE_BY_PLATFORM = {
  instagramreels: 0.0021,
  tiktok: 0.0359,
  youtubevideo: 0.0006,
  youtubeshort: 0.0041
};

async function loadSyncSettings() {
  try {
    return dotenv.parse(await fs.readFile(SYNC_SETTINGS_PATH, 'utf8'));
  } catch (_e) {
    return {};
  }
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function startOfCurrentReportWeek(date = new Date()) {
  const chinaOffsetMs = 8 * 60 * 60 * 1000;
  const chinaDate = new Date(date.getTime() + chinaOffsetMs);
  const sundayOffset = chinaDate.getUTCDay();
  const startUtc = Date.UTC(
    chinaDate.getUTCFullYear(),
    chinaDate.getUTCMonth(),
    chinaDate.getUTCDate() - sundayOffset,
    0,
    0,
    0,
    0
  ) - chinaOffsetMs;
  return new Date(startUtc);
}

function completedReportWeekBounds(date = new Date()) {
  const weekEnd = startOfCurrentReportWeek(date);
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
}

function normalizeSyncSettings(input = {}) {
  const allowedPlatforms = new Set(['all', 'instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok']);
  const platformFilter = normalizePlatform(input.platformFilter || input.SYNC_PLATFORM_FILTER || 'all') || 'all';
  return {
    days: positiveInt(input.days || input.SYNC_DAYS, 7),
    maxItems: positiveInt(input.maxItems || input.SYNC_MAX_ITEMS_PER_INFLUENCER, 30),
    limitInfluencers: positiveInt(input.limitInfluencers || input.SYNC_LIMIT_INFLUENCERS, 200),
    platformFilter: allowedPlatforms.has(platformFilter) ? platformFilter : 'all',
    globalKeywords: normalizeText(input.globalKeywords || input.SYNC_GLOBAL_KEYWORDS || 'yozma,yozmasport', 500).replace(/[\r\n]+/g, ',')
  };
}

async function saveSyncSettings(settings) {
  const content = `# 周报任务只保留“上周六 00:00 到本周六 00:00”之间发布的视频。
# 对外汇报时等于上周六到本周五；不混入正在进行中的当前周。
# 这个数字控制窗口长度，抓取一个完整周报周期时保持为 7。
SYNC_DAYS=${settings.days}

# 每位达人每次向 Apify 请求的最新视频上限。
# 这不是最终写入数量；超过时间范围或未命中关键词的视频不会写入。
# 普通监控先控制在 ${settings.maxItems} 条以内；重要达人需要全量时再临时调高。
SYNC_MAX_ITEMS_PER_INFLUENCER=${settings.maxItems}

# 单轮最多处理多少位“是否监控=是”的达人。
SYNC_LIMIT_INFLUENCERS=${settings.limitInfluencers}

# all / instagramreels / youtubevideo / youtubeshort / tiktok
SYNC_PLATFORM_FILTER=${settings.platformFilter}

# 判断是否为 Yozma 相关视频的关键词，使用英文逗号分隔。
SYNC_GLOBAL_KEYWORDS=${settings.globalKeywords}

# 已登记视频表现数据采用固定里程碑追踪：
# 上线满 7 天刷新一次，上线满 30 天刷新一次，之后停止追踪。
# 每天只做轻量到期检查；没有到期视频时不会调用 Apify。
`;
  await fs.writeFile(SYNC_SETTINGS_PATH, content, 'utf8');
}

async function loadDingTalkDashboardCache() {
  if (dingTalkDashboardCache) return dingTalkDashboardCache;
  try {
    dingTalkDashboardCache = JSON.parse(await fs.readFile(DASHBOARD_CACHE_PATH, 'utf8'));
    return dingTalkDashboardCache;
  } catch (_error) {
    return null;
  }
}

async function saveDingTalkDashboardCache(dashboard) {
  dingTalkDashboardCache = dashboard;
  await fs.mkdir(path.dirname(DASHBOARD_CACHE_PATH), { recursive: true });
  await fs.writeFile(DASHBOARD_CACHE_PATH, JSON.stringify(dashboard, null, 2), 'utf8');
}

async function readJsonArray(filePath) {
  try {
    const value = JSON.parse(await fs.readFile(filePath, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (_error) {
    return [];
  }
}

async function writeJsonArray(filePath, rows) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(Array.isArray(rows) ? rows : [], null, 2), 'utf8');
}

async function readLocalDataStore() {
  const [influencers, videos, snapshots, runs, affiliateSales] = await Promise.all([
    readJsonArray(LOCAL_DATA_FILES.influencers),
    readJsonArray(LOCAL_DATA_FILES.videos),
    readJsonArray(LOCAL_DATA_FILES.snapshots),
    readJsonArray(LOCAL_DATA_FILES.runs),
    readJsonArray(LOCAL_DATA_FILES.affiliateSales)
  ]);
  return { influencers, videos, snapshots, runs, affiliateSales };
}

async function readJsonObject(filePath, fallback = {}) {
  try {
    const value = JSON.parse(await fs.readFile(filePath, 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
  } catch (_error) {
    return fallback;
  }
}

async function writeJsonObject(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

async function loadBudgetLedger() {
  const ledger = normalizeLedger(await readJsonObject(APIFY_BUDGET_PATH, {}));
  if (!ledger.legacyRunsImportedAt) {
    const legacyRuns = await readJsonArray(LOCAL_DATA_FILES.runs);
    const known = new Set(ledger.entries.map((row) => row.reservationId));
    for (const row of legacyRuns) {
      const fields = row.fields || row;
      const actualUsd = Number(fields.usageUsd || 0);
      const createdAt = String(fields.createdAt || '');
      const reservationId = `legacy:${row.id || fields.runId || createdAt}`;
      if (!actualUsd || !/^\d{4}-\d{2}/.test(createdAt) || known.has(reservationId)) continue;
      ledger.entries.push({ reservationId, month: createdAt.slice(0, 7), actualUsd, settledAt: createdAt, meta: { source: 'legacy-runs-import' } });
      known.add(reservationId);
    }
    ledger.legacyRunsImportedAt = new Date().toISOString();
  }
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  ledger.reservations = ledger.reservations.filter((row) => Date.parse(row.createdAt || 0) >= cutoff);
  return ledger;
}

async function reserveActorBudget({ reservationId, batchActualUsd = 0, meta = {} }) {
  const ledger = await loadBudgetLedger();
  const decision = canStartActor({ ledger, batchActualUsd, reserveUsd: APIFY_BUDGET_POLICY.perActorUsd });
  if (!decision.ok) return decision;
  ledger.reservations.push({ reservationId, month: new Date().toISOString().slice(0, 7), reservedUsd: APIFY_BUDGET_POLICY.perActorUsd, createdAt: new Date().toISOString(), meta });
  await writeJsonObject(APIFY_BUDGET_PATH, ledger);
  return { ...decision, status: budgetStatus({ ledger, batchActualUsd }) };
}

async function settleActorBudget({ reservationId, actualUsd = 0, meta = {} }) {
  const ledger = await loadBudgetLedger();
  ledger.reservations = ledger.reservations.filter((row) => row.reservationId !== reservationId);
  ledger.entries.unshift({ reservationId, month: new Date().toISOString().slice(0, 7), actualUsd: Number(actualUsd || 0), settledAt: new Date().toISOString(), meta });
  ledger.entries = ledger.entries.slice(0, 2000);
  await writeJsonObject(APIFY_BUDGET_PATH, ledger);
  return budgetStatus({ ledger });
}

async function releaseActorBudget(reservationId) {
  const ledger = await loadBudgetLedger();
  ledger.reservations = ledger.reservations.filter((row) => row.reservationId !== reservationId);
  await writeJsonObject(APIFY_BUDGET_PATH, ledger);
}

function isPinned(fields = {}) {
  return ['手工钉选', 'Ryan钉选', '是否钉选'].some((key) => {
    const value = fields[key];
    if (value === undefined || value === null || readSelectText(value) === '') return false;
    return parseMonitorEnabled(value);
  });
}

async function loadCrmMonitorTargets() {
  const state = await readJsonObject(CRM_MONITOR_TARGETS_PATH, { rows: [] });
  const urls = new Set();
  const names = new Set();
  for (const row of state.rows || []) {
    if (row.name) names.add(normalizeCreatorName(row.name));
    for (const url of row.profileUrls || []) urls.add(normalizePostUrl(url));
  }
  return {
    available: Array.isArray(state.rows),
    generatedAt: state.generatedAt || '',
    summary: state.summary || {},
    stoppedRows: Array.isArray(state.stoppedRows) ? state.stoppedRows.length : 0,
    urls,
    names
  };
}

function isCrmMonitorTarget(row, targetState) {
  const fields = row.fields || row;
  if (isPinned(fields)) return true;
  const homeUrl = readLinkCell(fields['红人链接']);
  if (homeUrl) return targetState.urls.has(normalizePostUrl(homeUrl));
  return targetState.names.has(normalizeCreatorName(fields['红人名称']));
}

function localRowsToRecords(rows) {
  return (rows || []).map((row, index) => ({
    id: row.id || row.recordId || `local_${index + 1}`,
    fields: row.fields || row
  }));
}

function makeLocalId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function inferInfluencerNameFromUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').map((part) => part.trim()).filter(Boolean);
    const handle = parts.find((part) => part.startsWith('@')) || parts[0] || url.hostname.replace(/^www\./, '');
    return handle.replace(/^@/, '').replace(/[_-]+$/g, '');
  } catch (_error) {
    return value.replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
  }
}

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const keys = [...new Set(list.flatMap((row) => Object.keys(row.fields || row)))];
  const lines = [keys.map(csvEscape).join(',')];
  for (const row of list) {
    const fields = row.fields || row;
    lines.push(keys.map((key) => csvEscape(readLinkCell(fields[key]) || readSelectText(fields[key]) || fields[key])).join(','));
  }
  return lines.join('\n');
}

function sanitizeErrorMessage(error) {
  return redactSecrets(String(error && error.message ? error.message : error || ''))
    .replace(/token=[^&\s;]+/gi, 'token=***')
    .replace(/apify_api_[A-Za-z0-9_-]+/g, 'apify_api_***');
}

function makeLinkCell(url) {
  const value = String(url || '').trim();
  return value ? { text: value, link: value } : '';
}

function inferPlatformFromVideoUrl(rawUrl) {
  const url = String(rawUrl || '').toLowerCase();
  if (url.includes('instagram.com')) return 'instagramreels';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com/shorts') || url.includes('youtu.be/shorts')) return 'youtubeshort';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtubevideo';
  return '';
}

function extractVideoIdFromUrl(rawUrl, platform = '') {
  const value = String(rawUrl || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').map((part) => part.trim()).filter(Boolean);
    if (platform === 'youtubevideo') return url.searchParams.get('v') || parts.at(-1) || '';
    if (platform === 'youtubeshort') return parts.includes('shorts') ? parts[parts.indexOf('shorts') + 1] || '' : parts.at(-1) || '';
    if (platform === 'tiktok') return parts.includes('video') ? parts[parts.indexOf('video') + 1] || '' : parts.at(-1) || '';
    if (platform === 'instagramreels') {
      const marker = parts.findIndex((part) => ['p', 'reel', 'tv'].includes(part));
      return marker >= 0 ? parts[marker + 1] || '' : parts.at(-1) || '';
    }
    return parts.at(-1) || '';
  } catch (_error) {
    return '';
  }
}

function inferCreatorFromVideoUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').map((part) => part.trim()).filter(Boolean);
    if (url.hostname.includes('tiktok.com')) return (parts.find((part) => part.startsWith('@')) || '').replace(/^@/, '');
    if (url.hostname.includes('instagram.com')) {
      const marker = parts.findIndex((part) => ['p', 'reel', 'tv'].includes(part));
      return marker > 0 ? parts[marker - 1].replace(/^@/, '') : '';
    }
    if (url.hostname.includes('youtube.com')) return (parts.find((part) => part.startsWith('@')) || '').replace(/^@/, '');
    return '';
  } catch (_error) {
    return '';
  }
}

function getDiscoveryActorRequest({ platform, influencerInput, maxItems, days }) {
  const actorId =
    platform === 'youtubevideo'
      ? 'h7sDV53CddomktSi5'
      : platform === 'youtubeshort'
        ? 'WT1BVWatl2aHVeFEH'
        : platform === 'tiktok'
          ? 'GdWCkxBtKWOsKjdch'
          : 'xMc5Ga1oCONPmWJIa';
  const actorInput =
    platform === 'youtubevideo'
      ? buildYouTubeVideoActorInput({ influencerInput, maxItems, days })
      : platform === 'youtubeshort'
        ? buildYouTubeShortActorInput({ influencerInput, maxItems, days })
        : platform === 'tiktok'
          ? buildTikTokActorInput({ influencerInput, maxItems, days })
          : buildActorInput({ platform: 'instagram', influencerInput, maxItems, days, actorId });
  return { actorId, actorInput };
}

function cleanDiscoveryItem({ platform, item, keywords, windowEnd, days }) {
  if (platform === 'youtubevideo' || platform === 'youtubeshort') {
    return cleanYouTubeItem(item, keywords, windowEnd, days, platform);
  }
  if (platform === 'tiktok') return cleanTikTokItem(item, keywords, windowEnd, days);
  return cleanItem(item, 'instagram', keywords, windowEnd, days);
}

function buildLocalCandidateAudit(rows) {
  const countByPlatform = (list) =>
    list.reduce((counts, row) => {
      const key = row.platform || '未识别';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  const supported = new Set(['instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok']);
  const monitored = rows.filter((row) => parseMonitorEnabled((row.fields || {})['是否监控']));
  const identified = monitored.filter((row) => row.fields['红人名称'] || readLinkCell(row.fields['红人链接']));
  const eligible = identified.filter((row) => supported.has(row.platform));
  const unsupported = identified.filter((row) => !supported.has(row.platform));
  return {
    totalRows: rows.length,
    monitoredRows: monitored.length,
    eligibleRows: eligible.length,
    disabledRows: rows.length - monitored.length,
    missingIdentityRows: monitored.length - identified.length,
    unsupportedRows: unsupported.length,
    byPlatform: countByPlatform(eligible),
    unsupportedByPlatform: countByPlatform(unsupported)
  };
}

function estimateApifyUsageForCandidates(rows) {
  const byPlatform = {};
  let estimatedUsageUsd = 0;
  for (const row of rows || []) {
    const platform = row.platform || 'unknown';
    const unit = APIFY_USAGE_ESTIMATE_BY_PLATFORM[platform] || 0.013;
    byPlatform[platform] = byPlatform[platform] || { count: 0, unitUsd: unit, estimatedUsd: 0 };
    byPlatform[platform].count += 1;
    byPlatform[platform].estimatedUsd += unit;
    estimatedUsageUsd += unit;
  }
  for (const item of Object.values(byPlatform)) item.estimatedUsd = Number(item.estimatedUsd.toFixed(4));
  return {
    estimatedUsageUsd: Number(estimatedUsageUsd.toFixed(4)),
    estimateBasis: '按本机历史 Apify 运行记录估算，真实费用会随平台、视频数量、Actor 状态波动。',
    byPlatform
  };
}

async function writeWorkflowJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

const BUY_INTENT_KEYWORDS = [
  'buy',
  'link',
  'price',
  'where to buy',
  'how much',
  'order',
  'shop',
  'discount',
  'code',
  '怎么买',
  '链接',
  '价格',
  '多少钱',
  '哪里买',
  '折扣码'
];

function normalizeKeywords(input) {
  if (!input) return [];
  return String(input)
    .split(/[，,]/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') return value.split(/[，,]/).map((v) => v.trim()).filter(Boolean);
  return [value];
}

function extractHashtagsFromCaption(caption) {
  if (!caption) return [];
  const matches = String(caption).match(/#[\p{L}\p{N}_]+/gu);
  return matches ? [...new Set(matches)] : [];
}

function pickFirst(item, keys, fallback = '') {
  for (const key of keys) {
    const value = key.split('.').reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), item);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function toNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const clean = String(value).replace(/,/g, '').trim();
  const num = Number(clean);
  return Number.isFinite(num) ? num : defaultValue;
}

function parseDateSafe(value) {
  if (!value) return null;
  if (typeof value === 'number') {
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchKeywords(text, keywords) {
  if (!text || keywords.length === 0) return [];
  const lower = String(text).toLowerCase();
  return keywords.filter((k) => lower.includes(k));
}

function collectTextFromComments(comments) {
  if (!Array.isArray(comments)) return String(comments || '');
  return comments
    .map((c) => {
      if (typeof c === 'string') return c;
      if (typeof c === 'object' && c) {
        return c.text || c.comment || c.content || '';
      }
      return '';
    })
    .filter(Boolean)
    .join(' | ');
}

function extractInstagramUsername(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  if (!/^https?:\/\//i.test(raw)) {
    return raw.replace(/^@/, '').split(/[/?#]/)[0].trim();
  }

  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);
    if (!parts.length) return '';
    if (parts[0] === 'p' || parts[0] === 'reel' || parts[0] === 'tv') return '';
    return parts[0].replace(/^@/, '').trim();
  } catch (_e) {
    return '';
  }
}

function buildActorInput({ platform, influencerInput, maxItems, days, actorId }) {
  const usernameFromInput = extractInstagramUsername(influencerInput);
  const primaryUsername = (usernameFromInput || influencerInput || '').replace(/^@/, '').trim();
  const usernameList = [primaryUsername, influencerInput].filter(Boolean);
  const uniqueUsernames = [...new Set(usernameList)];
  const safeDays = Math.max(1, Number(days) || 7);
  const newerThanIso = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const actor = String(actorId || '').trim();

  // Default/fixed actor in this project: xMc5Ga1oCONPmWJIa
  // Use official input shape and cost-safe defaults.
  if (!actor || actor === 'xMc5Ga1oCONPmWJIa') {
    return {
      username: uniqueUsernames,
      resultsLimit: maxItems,
      onlyPostsNewerThan: `${safeDays} days`,
      skipPinnedPosts: true,
      includeSharesCount: false,
      includeTranscript: false,
      includeDownloadedVideo: false
    };
  }

  return {
    // This actor requires username as an array.
    username: uniqueUsernames,
    // Compatibility field for actors using usernames.
    usernames: uniqueUsernames,
    resultsLimit: maxItems,
    skipPinnedPosts: false,
    dataDetailLevel: 'basicData',
    // Time window constraints for actors that support "newer than".
    newerThan: `${safeDays} days`,
    onlyPostsNewerThan: newerThanIso,
    postsNewerThan: newerThanIso,
    dateFrom: newerThanIso,
    // Keep compatibility hints for other actors as well.
    directUrls: [influencerInput],
    startUrls: [influencerInput].map((url) => ({ url })),
    userUrls: [influencerInput],
    resultsPerPage: maxItems,
    maxItems,
    search: influencerInput
  };
}

function buildYouTubeVideoActorInput({ influencerInput, maxItems, days }) {
  const safeDays = Math.max(1, Number(days) || 14);
  const oldest = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  const oldestPostDate = oldest.toISOString().slice(0, 10);
  return {
    maxResults: Math.max(1, Number(maxItems) || 27),
    maxResultsShorts: 0,
    maxResultStreams: 0,
    startUrls: [{ url: String(influencerInput || '').trim() }],
    downloadSubtitles: false,
    saveSubsToKVS: false,
    subtitlesLanguage: 'en',
    preferAutoGeneratedSubtitles: false,
    subtitlesFormat: 'srt',
    sortingOrder: 'relevance',
    dateFilter: 'month',
    videoType: 'video',
    oldestPostDate,
    sortVideosBy: 'NEWEST'
  };
}

function buildYouTubeShortActorInput({ influencerInput, maxItems, days }) {
  const safeDays = Math.max(1, Number(days) || 14);
  const oldest = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  const oldestPostDate = oldest.toISOString().slice(0, 10);
  const raw = String(influencerInput || '').trim();
  const channel =
    raw
      .replace(/^https?:\/\/(www\.)?youtube\.com\//i, '')
      .replace(/^@/, '')
      .split(/[/?#]/)[0]
      .trim() || raw;
  return {
    channels: [channel],
    maxResultsShorts: Math.max(1, Number(maxItems) || 27),
    oldestPostDate,
    sortChannelShortsBy: 'NEWEST'
  };
}

function buildTikTokActorInput({ influencerInput, maxItems, days }) {
  const raw = String(influencerInput || '').trim();
  const profile = raw
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, '')
    .split(/[/?#]/)[0]
    .trim();
  return {
    hashtags: [],
    resultsPerPage: Math.max(1, Number(maxItems) || 30),
    profiles: [profile || raw],
    profileScrapeSections: ['videos'],
    profileSorting: 'latest',
    excludePinnedPosts: true,
    // Keep cost-sensitive add-ons disabled by default.
    commentsPerPost: 0,
    topLevelCommentsPerPost: 0,
    maxRepliesPerComment: 0,
    scrapeRelatedVideos: false,
    shouldDownloadAvatars: false,
    shouldDownloadCovers: false,
    shouldDownloadMusicCovers: false,
    shouldDownloadSlideshowImages: false,
    shouldDownloadVideos: false,
    downloadSubtitlesOptions: 'NEVER_DOWNLOAD_SUBTITLES'
  };
}

async function runApifyActor({ apiToken, actorId, actorInput, maxItems = 30, maxTotalChargeUsd = APIFY_BUDGET_POLICY.perActorUsd }) {
  const runUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?waitForFinish=180&maxItems=${Math.max(1, Number(maxItems) || 1)}&maxTotalChargeUsd=${Number(maxTotalChargeUsd)}`;
  const authHeaders = { Authorization: `Bearer ${apiToken}` };

  let runRes;
  try {
    runRes = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(actorInput)
    });
  } catch (e) {
    throw new Error(`Apify run request network failed: ${runUrl} ; ${e.message || e}`);
  }

  if (!runRes.ok) {
    const detail = await runRes.text();
    if (runRes.status === 402 && detail.includes('not-enough-usage-to-run-paid-actor')) {
      const remaining = detail.match(/remaining usage of \$([0-9]+(?:\.[0-9]+)?)/i)?.[1];
      throw new Error(
        `Apify 当前套餐可用额度不足${remaining ? `，当前剩余约 $${remaining}` : ''}。本次抓取未启动，也不会写入钉钉。请检查本机 Token 是否属于正确账号，或升级 Apify 套餐：https://console.apify.com/billing/subscription`
      );
    }
    throw new Error(`Apify actor run failed: ${runRes.status} ${detail}`);
  }

  const runJson = await runRes.json();
  const runData = runJson.data || {};
  const datasetId = runData.defaultDatasetId;
  const runId = runData.id;

  if (!datasetId) {
    throw new Error('Apify returned no datasetId. Please check actor input and actor configuration.');
  }

  // In some cases run metadata returns before items are fully persisted.
  // Poll run status briefly and only continue when it is finished.
  const terminalStatuses = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);
  let latestRunData = runData;
  for (let i = 0; i < 6; i += 1) {
    if (terminalStatuses.has((latestRunData.status || '').toUpperCase())) break;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const runStatusUrl = `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}`;
    let runStatusRes;
    try {
      runStatusRes = await fetch(runStatusUrl, { headers: authHeaders });
    } catch (e) {
      throw new Error(`Apify run status request network failed: ${runStatusUrl} ; ${e.message || e}`);
    }
    if (!runStatusRes.ok) break;
    const runStatusJson = await runStatusRes.json();
    latestRunData = runStatusJson.data || latestRunData;
  }

  const itemsUrl = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?clean=true`;
  let itemsRes;
  try {
    itemsRes = await fetch(itemsUrl, { headers: authHeaders });
  } catch (e) {
    throw new Error(`Apify dataset request network failed: ${itemsUrl} ; ${e.message || e}`);
  }

  if (!itemsRes.ok) {
    const detail = await itemsRes.text();
    throw new Error(`Apify dataset fetch failed: ${itemsRes.status} ${detail}`);
  }

  const items = await itemsRes.json();
  return { runData: latestRunData, datasetId, items: Array.isArray(items) ? items : [] };
}

function buildDetailActorInput({ targets, maxItems = 50 }) {
  const cleanedTargets = (Array.isArray(targets) ? targets : [])
    .map((t) => String(t || '').trim())
    .filter(Boolean);
  return {
    // For this actor, username array can accept usernames and post URLs.
    username: cleanedTargets,
    // Extra compatibility for actors preferring URL-style inputs.
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

function cleanItem(item, platform, keywords, windowEnd, days) {
  const publishRaw = pickFirst(item, ['publishTime', 'timestamp', 'createTime', 'takenAt', 'createdAt', 'time']);
  const publishDate = parseDateSafe(publishRaw);

  const caption = pickFirst(item, ['caption', 'text', 'description', 'title'], '');
  const hashtagRaw = pickFirst(item, ['hashtags', 'hashTags', 'tags'], []);
  const hashtagsBase = Array.isArray(hashtagRaw) ? hashtagRaw : toArray(hashtagRaw);
  const hashtags = hashtagsBase.length ? hashtagsBase : extractHashtagsFromCaption(caption);

  const transcript = pickFirst(item, ['transcript', 'videoTranscript', 'subtitles', 'speechText'], '');
  const latestCommentsRaw = pickFirst(item, ['latestComments', 'comments', 'topComments'], []);
  const latestComments = Array.isArray(latestCommentsRaw) ? latestCommentsRaw : toArray(latestCommentsRaw);
  const latestCommentsText = collectTextFromComments(latestComments);

  const captionHits = matchKeywords(caption, keywords);
  const hashtagHits = matchKeywords(hashtags.join(' '), keywords);
  const transcriptHits = matchKeywords(transcript, keywords);
  const commentHits = matchKeywords(latestCommentsText, keywords);

  const buyIntentHits = matchKeywords(
    `${caption} ${hashtags.join(' ')} ${transcript} ${latestCommentsText}`,
    BUY_INTENT_KEYWORDS
  );

  const matchFields = [];
  if (captionHits.length) matchFields.push(`caption(${captionHits.join('|')})`);
  if (hashtagHits.length) matchFields.push(`hashtags(${hashtagHits.join('|')})`);
  if (transcriptHits.length) matchFields.push(`transcript(${transcriptHits.join('|')})`);
  if (commentHits.length) matchFields.push(`latestComments(${commentHits.join('|')})`);

  const baseScore =
    captionHits.length * 25 +
    hashtagHits.length * 20 +
    transcriptHits.length * 25 +
    commentHits.length * 20 +
    Math.min(buyIntentHits.length * 5, 20);

  const confidenceScore = Math.max(0, Math.min(100, baseScore));
  const hasKeywordHit = captionHits.length || hashtagHits.length || transcriptHits.length || commentHits.length;
  const isProductPost = Boolean(hasKeywordHit);
  const productMatchStatus = isProductPost ? '是' : '否';

  const videoPlayCount = toNumber(
    pickFirst(item, ['videoPlayCount', 'playCount', 'plays', 'video.playCount', 'videoViewCount', 'viewCount', 'views'])
  );
  const videoViewCount = toNumber(
    pickFirst(item, ['videoViewCount', 'viewCount', 'views', 'video.viewCount', 'videoPlayCount', 'playCount', 'plays'])
  );
  const likesCount = toNumber(pickFirst(item, ['likesCount', 'likeCount', 'likes', 'diggCount']));
  const commentsCount = toNumber(pickFirst(item, ['commentsCount', 'commentCount', 'comments_count']));
  const sharesCount = toNumber(pickFirst(item, ['sharesCount', 'shareCount', 'shares']));

  const engagementRate = videoPlayCount > 0 ? (likesCount + commentsCount + sharesCount) / videoPlayCount : 0;

  const highReasons = [];
  if (videoPlayCount >= 50000) highReasons.push('播放量>=50000');
  if (commentsCount >= 50) highReasons.push('评论数>=50');
  if (sharesCount >= 100) highReasons.push('分享数>=100');
  if (buyIntentHits.length) highReasons.push(`评论/文本购买意图词:${[...new Set(buyIntentHits)].join('|')}`);

  const isHighPotential = highReasons.length > 0;

  const cleaned = {
    platform,
    creatorId: pickFirst(item, ['creatorId', 'authorId', 'ownerId', 'user.id'], ''),
    creatorUsername: pickFirst(
      item,
      ['creatorUsername', 'ownerUsername', 'authorUsername', 'username', 'authorMeta.name', 'user.username'],
      ''
    ),
    creatorFullName: pickFirst(item, ['ownerFullName', 'authorName', 'fullName', 'user.fullName'], ''),
    creatorFollowersCount: toNumber(
      pickFirst(item, ['followersCount', 'followerCount', 'ownerFollowersCount', 'authorMeta.fans', 'user.followers']),
      0
    ),
    postId: pickFirst(item, ['postId', 'id', 'awemeId', 'shortCode'], ''),
    postUrl: pickFirst(item, ['postUrl', 'url', 'videoUrl', 'webVideoUrl', 'permalink'], ''),
    publishTime: publishDate ? publishDate.toISOString() : '',
    caption,
    hashtags,
    videoPlayCount,
    videoViewCount,
    likesCount,
    commentsCount,
    sharesCount,
    videoDuration: toNumber(pickFirst(item, ['videoDuration', 'duration', 'video.duration']), 0),
    videoUrl: pickFirst(item, ['videoUrl', 'video.downloadAddr', 'video.playAddr'], ''),
    coverImage: pickFirst(item, ['coverImage', 'cover', 'thumbnail', 'video.cover'], ''),
    transcript,
    latestComments,
    engagementRate,
    isProductPost,
    productMatchStatus,
    matchReason: matchFields.length ? matchFields.join('; ') : '未命中关键词',
    confidenceScore,
    isHighPotential,
    highPotentialReason: highReasons.join('; ')
  };

  const cutoff = new Date(windowEnd.getTime() - days * 24 * 60 * 60 * 1000);
  const keep = publishDate ? publishDate >= cutoff && publishDate < windowEnd : false;

  return { cleaned, keep, publishDateValid: !!publishDate };
}

function cleanYouTubeItem(item, keywords, windowEnd, days, ytPlatform = 'youtubevideo') {
  const publishRaw = pickFirst(item, ['publishedTime', 'publishDate', 'publishedAt', 'date', 'timestamp']);
  const publishDate = parseDateSafe(publishRaw);
  const title = pickFirst(item, ['title', 'name'], '');
  const description = pickFirst(item, ['description', 'text'], '');
  const caption = `${title}${description ? `\n${description}` : ''}`.trim();
  const hashtags = toArray(pickFirst(item, ['hashtags', 'keywords', 'tags'], []));
  const transcript = pickFirst(item, ['transcript', 'subtitles'], '');
  const latestComments = toArray(pickFirst(item, ['latestComments', 'comments'], []));
  const latestCommentsText = collectTextFromComments(latestComments);

  const captionHits = matchKeywords(caption, keywords);
  const hashtagHits = matchKeywords(hashtags.join(' '), keywords);
  const transcriptHits = matchKeywords(transcript, keywords);
  const commentHits = matchKeywords(latestCommentsText, keywords);
  const hasKeywordHit = captionHits.length || hashtagHits.length || transcriptHits.length || commentHits.length;

  const matchFields = [];
  if (captionHits.length) matchFields.push(`caption(${captionHits.join('|')})`);
  if (hashtagHits.length) matchFields.push(`hashtags(${hashtagHits.join('|')})`);
  if (transcriptHits.length) matchFields.push(`transcript(${transcriptHits.join('|')})`);
  if (commentHits.length) matchFields.push(`latestComments(${commentHits.join('|')})`);

  const confidenceScore = hasKeywordHit ? 60 : 0;
  const videoPlayCount = toNumber(pickFirst(item, ['videoPlayCount', 'views', 'viewCount', 'numberOfViews']));
  const videoViewCount = toNumber(pickFirst(item, ['videoViewCount', 'views', 'viewCount', 'numberOfViews']));
  const likesCount = toNumber(pickFirst(item, ['likesCount', 'likes', 'numberOfLikes']));
  const commentsCount = toNumber(pickFirst(item, ['commentsCount', 'comments', 'numberOfComments']));
  const sharesCount = 0;
  const engagementRate = videoPlayCount > 0 ? (likesCount + commentsCount + sharesCount) / videoPlayCount : 0;

  const cleaned = {
    platform: ytPlatform,
    creatorId: pickFirst(item, ['channelId', 'authorId', 'ownerId'], ''),
    creatorUsername: pickFirst(item, ['channelName', 'authorName', 'ownerUsername'], ''),
    creatorFullName: pickFirst(item, ['channelName', 'authorName'], ''),
    creatorFollowersCount: toNumber(
      pickFirst(item, ['numberOfSubscribers', 'subscriberCount', 'subscribers', 'channelSubscriberCount', 'authorSubscriberCount']),
      0
    ),
    postId: pickFirst(item, ['id', 'videoId'], ''),
    postUrl: pickFirst(item, ['url', 'videoUrl', 'webpageUrl'], ''),
    publishTime: publishDate ? publishDate.toISOString() : '',
    caption,
    hashtags,
    videoPlayCount,
    videoViewCount,
    likesCount,
    commentsCount,
    sharesCount,
    videoDuration: toNumber(pickFirst(item, ['lengthSeconds', 'duration']), 0),
    videoUrl: pickFirst(item, ['url', 'videoUrl'], ''),
    coverImage: pickFirst(item, ['thumbnailUrl', 'thumbnail'], ''),
    transcript,
    latestComments,
    engagementRate,
    isProductPost: Boolean(hasKeywordHit),
    productMatchStatus: hasKeywordHit ? '是' : '否',
    matchReason: matchFields.length ? matchFields.join('; ') : '未命中关键词',
    confidenceScore,
    isHighPotential: false,
    highPotentialReason: ''
  };

  const cutoff = new Date(windowEnd.getTime() - days * 24 * 60 * 60 * 1000);
  const keep = publishDate ? publishDate >= cutoff && publishDate < windowEnd : false;
  return { cleaned, keep, publishDateValid: !!publishDate };
}

function cleanTikTokItem(item, keywords, windowEnd, days) {
  const publishRaw = pickFirst(item, ['createTimeISO', 'createTime', 'timestamp', 'publishedAt']);
  const publishDate = parseDateSafe(publishRaw);
  const caption = pickFirst(item, ['text', 'desc', 'caption', 'description'], '');
  const hashtags = toArray(pickFirst(item, ['hashtags', 'tags'], []));
  const transcript = pickFirst(item, ['transcript', 'subtitleText'], '');
  const latestComments = toArray(pickFirst(item, ['latestComments', 'comments'], []));
  const latestCommentsText = collectTextFromComments(latestComments);

  const captionHits = matchKeywords(caption, keywords);
  const hashtagHits = matchKeywords(hashtags.join(' '), keywords);
  const transcriptHits = matchKeywords(transcript, keywords);
  const commentHits = matchKeywords(latestCommentsText, keywords);
  const hasKeywordHit = captionHits.length || hashtagHits.length || transcriptHits.length || commentHits.length;
  const matchFields = [];
  if (captionHits.length) matchFields.push(`caption(${captionHits.join('|')})`);
  if (hashtagHits.length) matchFields.push(`hashtags(${hashtagHits.join('|')})`);
  if (transcriptHits.length) matchFields.push(`transcript(${transcriptHits.join('|')})`);
  if (commentHits.length) matchFields.push(`latestComments(${commentHits.join('|')})`);

  const videoPlayCount = toNumber(pickFirst(item, ['playCount', 'stats.playCount', 'videoPlayCount', 'views']));
  const videoViewCount = toNumber(pickFirst(item, ['playCount', 'stats.playCount', 'videoViewCount', 'views']));
  const likesCount = toNumber(pickFirst(item, ['diggCount', 'stats.diggCount', 'likesCount', 'likes']));
  const commentsCount = toNumber(pickFirst(item, ['commentCount', 'stats.commentCount', 'commentsCount']));
  const sharesCount = toNumber(pickFirst(item, ['shareCount', 'stats.shareCount', 'sharesCount']));
  const engagementRate = videoPlayCount > 0 ? (likesCount + commentsCount + sharesCount) / videoPlayCount : 0;

  const cleaned = {
    platform: 'tiktok',
    creatorId: pickFirst(item, ['authorMeta.id', 'author.id', 'authorId', 'creatorId'], ''),
    creatorUsername: pickFirst(item, ['authorMeta.name', 'author.uniqueId', 'authorUsername'], ''),
    creatorFullName: pickFirst(item, ['authorMeta.nickName', 'author.nickname', 'authorMeta.name'], ''),
    creatorFollowersCount: toNumber(
      pickFirst(item, ['authorMeta.fans', 'author.stats.followerCount', 'author.followerCount', 'followerCount']),
      0
    ),
    postId: pickFirst(item, ['id', 'awemeId', 'videoId'], ''),
    postUrl: pickFirst(item, ['webVideoUrl', 'url', 'videoUrl'], ''),
    publishTime: publishDate ? publishDate.toISOString() : '',
    caption,
    hashtags,
    videoPlayCount,
    videoViewCount,
    likesCount,
    commentsCount,
    sharesCount,
    videoDuration: toNumber(pickFirst(item, ['videoMeta.duration', 'videoDuration', 'duration']), 0),
    videoUrl: pickFirst(item, ['videoUrl', 'videoMeta.downloadAddr', 'webVideoUrl'], ''),
    coverImage: pickFirst(item, ['covers.default', 'videoMeta.coverUrl', 'coverImage'], ''),
    transcript,
    latestComments,
    engagementRate,
    isProductPost: Boolean(hasKeywordHit),
    productMatchStatus: hasKeywordHit ? '是' : '否',
    matchReason: matchFields.length ? matchFields.join('; ') : '未命中关键词',
    confidenceScore: hasKeywordHit ? 60 : 0,
    isHighPotential: false,
    highPotentialReason: ''
  };

  const cutoff = new Date(windowEnd.getTime() - days * 24 * 60 * 60 * 1000);
  const keep = publishDate ? publishDate >= cutoff && publishDate < windowEnd : false;
  return { cleaned, keep, publishDateValid: !!publishDate };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'influencer-mvp', time: new Date().toISOString() });
});

app.get('/api/workflow/config', async (_req, res) => {
  const settings = normalizeSyncSettings(await loadSyncSettings());
  const weekEnd = completedReportWeekBounds().weekEnd;
  const weekStart = new Date(weekEnd.getTime() - settings.days * 24 * 60 * 60 * 1000);
  res.json({
    ok: true,
    config: {
      ...settings,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      apifyConfigured: Boolean(process.env.APIFY_API_TOKEN),
      dingTalkConfigured: Boolean(
        process.env.DINGTALK_APP_KEY &&
          process.env.DINGTALK_APP_SECRET &&
          process.env.DINGTALK_DOC_ID &&
          process.env.DINGTALK_INFLUENCER_TABLE_ID &&
          process.env.DINGTALK_VIDEO_TABLE_ID &&
          process.env.DINGTALK_SNAPSHOT_TABLE_ID &&
          process.env.DINGTALK_OPERATOR_ID
      ),
      dingTalkUrl: process.env.DINGTALK_DOC_URL || ''
    }
  });
});

app.post('/api/workflow/settings', async (req, res) => {
  try {
    const settings = normalizeSyncSettings(req.body || {});
    await saveSyncSettings(settings);
    const weekEnd = completedReportWeekBounds().weekEnd;
    const weekStart = new Date(weekEnd.getTime() - settings.days * 24 * 60 * 60 * 1000);
    return res.json({
      ok: true,
      message: '抓取配置已保存。',
      config: { ...settings, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '保存配置失败。' });
  }
});

app.post('/api/analyze-post', (req, res) => {
  res.json({
    ok: true,
    message: 'Reserved endpoint for single post analysis (v1 placeholder).',
    received: req.body || {}
  });
});

app.post('/api/scrape-influencer', async (req, res) => {
  try {
    const {
      platform,
      influencerInput,
      productKeywords,
      apiToken,
      actorId,
      useMockData = false,
      days = 7,
      maxItems = 50
    } = req.body || {};

    if (!useMockData && !apiToken && !process.env.APIFY_API_TOKEN) {
      return res.status(400).json({ ok: false, error: 'Apify Token 不能为空。' });
    }
    if (!influencerInput) {
      return res.status(400).json({ ok: false, error: '红人链接或ID 不能为空。' });
    }

    const finalToken = apiToken || process.env.APIFY_API_TOKEN;
    const keywordList = normalizeKeywords(productKeywords);
    const finalPlatform = (platform || 'unknown').toLowerCase();
    const now = new Date();
    const safeDays = Math.max(1, Number(days) || 7);
    const safeMaxItems = Math.max(1, Number(maxItems) || 50);
    const fixedActorId = String(actorId || 'xMc5Ga1oCONPmWJIa').trim();

    let runData = null;
    let datasetId = 'mock-dataset';
    let items = [];
    let actorInput = {};

    if (useMockData) {
      const mockPath = path.join(__dirname, 'data', 'mock', 'sample-items.json');
      const mockRaw = await fs.readFile(mockPath, 'utf-8');
      items = JSON.parse(mockRaw);
      runData = { id: 'mock-run', status: 'SUCCEEDED', mode: 'mock' };
    } else {
      actorInput = buildActorInput({
        platform: finalPlatform,
        influencerInput,
        maxItems: safeMaxItems,
        days: safeDays,
        actorId: fixedActorId
      });
      const runResult = await runApifyActor({
        apiToken: finalToken,
        actorId: fixedActorId,
        actorInput
      });
      runData = runResult.runData;
      datasetId = runResult.datasetId;
      items = runResult.items;
    }

    if (!items.length) {
      return res.status(400).json({ ok: false, error: 'Apify 返回为空，请检查 Actor、输入参数或账号近期内容。' });
    }

    const runTag = `${Date.now()}_${finalPlatform}`;
    await fs.writeFile(
      path.join(RAW_DIR, `raw_${runTag}.json`),
      JSON.stringify({ meta: { datasetId, runData, actorInput }, items }, null, 2),
      'utf-8'
    );

    const cleanedRows = [];
    let invalidTimeCount = 0;

    for (const item of items) {
      const { cleaned, keep, publishDateValid } = cleanItem(item, finalPlatform, keywordList, now, safeDays);
      if (!publishDateValid) invalidTimeCount += 1;
      if (keep) cleanedRows.push(cleaned);
    }

    await fs.writeFile(path.join(OUTPUT_DIR, `cleaned_${runTag}.json`), JSON.stringify(cleanedRows, null, 2), 'utf-8');

    res.json({
      ok: true,
      message: '抓取与分析完成。',
      datasetId,
      runId: runData && runData.id ? runData.id : null,
      runStatus: runData && runData.status ? runData.status : null,
      actorInput,
      rawCount: items.length,
      filteredCount: cleanedRows.length,
      invalidTimeCount,
      rows: cleanedRows
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || '服务内部错误。' });
  }
});

// Workflow module:
// After matched posts are registered, fetch post-level detail data using actor xMc5Ga1oCONPmWJIa.
app.post('/api/workflow/fetch-post-details', async (req, res) => {
  try {
    const {
      apiToken,
      actorId = 'xMc5Ga1oCONPmWJIa',
      targets = [],
      maxItems = 50
    } = req.body || {};

    if (!apiToken && !process.env.APIFY_API_TOKEN) {
      return res.status(400).json({ ok: false, error: 'Apify Token 不能为空。' });
    }
    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ ok: false, error: 'targets 不能为空，需传帖子链接或用户名数组。' });
    }

    const finalToken = apiToken || process.env.APIFY_API_TOKEN;
    const actorInput = buildDetailActorInput({ targets, maxItems });
    const { runData, datasetId, items } = await runApifyActor({
      apiToken: finalToken,
      actorId,
      actorInput
    });

    const runTag = `${Date.now()}_detail`;
    await fs.writeFile(
      path.join(RAW_DIR, `raw_${runTag}.json`),
      JSON.stringify({ meta: { datasetId, runData, actorInput }, items }, null, 2),
      'utf-8'
    );

    return res.json({
      ok: true,
      message: '帖子详情抓取完成。',
      actorId,
      runId: runData && runData.id ? runData.id : null,
      runStatus: runData && runData.status ? runData.status : null,
      datasetId,
      inputCount: targets.length,
      outputCount: items.length,
      actorInput,
      rows: items
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '服务内部错误。' });
  }
});

// Workflow module:
// 1) Scrape influencer posts
// 2) Filter matched product posts
// 3) Fetch detailed data for matched post URLs
app.post('/api/workflow/run-once', async (req, res) => {
  try {
    const {
      platform,
      influencerInput,
      productKeywords,
      apiToken,
      actorId,
      detailActorId = 'xMc5Ga1oCONPmWJIa',
      days = 7,
      maxItems = 50
    } = req.body || {};

    if (!apiToken && !process.env.APIFY_API_TOKEN) {
      return res.status(400).json({ ok: false, error: 'Apify Token 不能为空。' });
    }
    if (!influencerInput) {
      return res.status(400).json({ ok: false, error: '红人链接或ID 不能为空。' });
    }

    const finalToken = apiToken || process.env.APIFY_API_TOKEN;
    const keywordList = normalizeKeywords(productKeywords);
    const finalPlatform = (platform || 'instagram').toLowerCase();
    const now = new Date();
    const safeDays = Math.max(1, Number(days) || 7);
    const safeMaxItems = Math.max(1, Number(maxItems) || 50);
    const fixedActorId = String(actorId || 'xMc5Ga1oCONPmWJIa').trim();

    const actorInput = buildActorInput({
      platform: finalPlatform,
      influencerInput,
      maxItems: safeMaxItems,
      days: safeDays,
      actorId: fixedActorId
    });
    const runResult = await runApifyActor({
      apiToken: finalToken,
      actorId: fixedActorId,
      actorInput
    });

    const cleanedRows = [];
    for (const item of runResult.items) {
      const { cleaned, keep } = cleanItem(item, finalPlatform, keywordList, now, safeDays);
      if (keep) cleanedRows.push(cleaned);
    }

    const matchedRows = cleanedRows.filter((row) => row.isProductPost);
    const matchedTargets = [...new Set(matchedRows.map((r) => r.postUrl).filter(Boolean))];

    let detail = { rows: [], outputCount: 0, datasetId: null, runId: null, runStatus: null, actorInput: null };
    if (matchedTargets.length > 0) {
      const detailActorInput = buildDetailActorInput({ targets: matchedTargets, maxItems: matchedTargets.length });
      const detailRun = await runApifyActor({
        apiToken: finalToken,
        actorId: detailActorId,
        actorInput: detailActorInput
      });
      detail = {
        rows: detailRun.items,
        outputCount: detailRun.items.length,
        datasetId: detailRun.datasetId,
        runId: detailRun.runData && detailRun.runData.id ? detailRun.runData.id : null,
        runStatus: detailRun.runData && detailRun.runData.status ? detailRun.runData.status : null,
        actorInput: detailActorInput
      };
    }

    return res.json({
      ok: true,
      message: '工作流执行完成。',
      summary: {
        scrapedCount: runResult.items.length,
        filteredCount: cleanedRows.length,
        matchedCount: matchedRows.length,
        detailFetchedCount: detail.outputCount
      },
      scrape: {
        actorId: fixedActorId,
        runId: runResult.runData && runResult.runData.id ? runResult.runData.id : null,
        runStatus: runResult.runData && runResult.runData.status ? runResult.runData.status : null,
        datasetId: runResult.datasetId,
        actorInput
      },
      matchedRows,
      detail
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '服务内部错误。' });
  }
});

async function feishuGetTenantToken({ appId, appSecret }) {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`Feishu auth failed: ${json.msg}`);
  return json.tenant_access_token;
}

async function feishuListRecords({ tenantToken, appToken, tableId }) {
  let pageToken = '';
  const all = [];
  while (true) {
    const u = new URL(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    u.searchParams.set('page_size', '500');
    if (pageToken) u.searchParams.set('page_token', pageToken);
    const res = await fetch(u, { headers: { Authorization: `Bearer ${tenantToken}` } });
    const json = await res.json();
    if (json.code !== 0) throw new Error(`Feishu list records failed: ${json.msg}`);
    all.push(...(json.data?.items || []));
    if (!json.data?.has_more) break;
    pageToken = json.data?.page_token || '';
    if (!pageToken) break;
  }
  return all;
}

async function feishuListFields({ tenantToken, appToken, tableId }) {
  const u = new URL(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`);
  u.searchParams.set('page_size', '500');
  const res = await fetch(u, { headers: { Authorization: `Bearer ${tenantToken}` } });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`Feishu list fields failed: ${json.msg}`);
  return json.data?.items || [];
}

function filterFieldsBySchema(fields, allowedNames) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (allowedNames.has(k)) out[k] = v;
  }
  return out;
}

function toText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeText(value, maxLen = 3000) {
  const s = toText(value).replace(/\u0000/g, '').trim();
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

async function feishuUpdateRecord({ tenantToken, appToken, tableId, recordId, fields }) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  const json = await res.json();
  if (json.code !== 0) {
    const keys = Object.keys(fields || {}).join(', ');
    throw new Error(`Feishu update failed(${tableId}): ${json.msg}; fields=[${keys}]`);
  }
  return json.data;
}

async function feishuCreateRecord({ tenantToken, appToken, tableId, fields }) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  const json = await res.json();
  if (json.code !== 0) {
    const keys = Object.keys(fields || {}).join(', ');
    throw new Error(`Feishu create failed(${tableId}): ${json.msg}; fields=[${keys}]`);
  }
  return json.data;
}

async function feishuCreateRecordWithProbe({ tenantToken, appToken, tableId, fields }) {
  // Avoid side-effect probing that can create partial garbage rows.
  return feishuCreateRecord({ tenantToken, appToken, tableId, fields });
}

function readLinkCell(cell) {
  if (!cell) return '';
  if (typeof cell === 'string') return cell;
  if (typeof cell === 'object') return cell.link || cell.text || '';
  return '';
}

function readSelectText(cell) {
  if (!cell) return '';
  if (typeof cell === 'string') return cell.trim();
  if (Array.isArray(cell)) {
    const first = cell[0];
    if (!first) return '';
    if (typeof first === 'string') return first.trim();
    if (typeof first === 'object') return String(first.text || first.name || first.value || '').trim();
  }
  if (typeof cell === 'object') return String(cell.text || cell.name || cell.value || '').trim();
  return '';
}

function parseMonitorEnabled(cell) {
  if (cell === undefined) return true;
  if (cell === null) return true;
  if (typeof cell === 'boolean') return cell;
  const text = readSelectText(cell).toLowerCase();
  if (!text) return true;
  if (['否', 'no', 'false', '0', 'off', 'disable', 'disabled', '不监控'].includes(text)) return false;
  if (['是', 'yes', 'true', '1', 'on', 'enable', 'enabled', '监控'].includes(text)) return true;
  return true;
}

function normalizePlatform(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '');
  if (!v) return '';
  if (['instagramreels', 'igreels', 'instagram'].includes(v)) return 'instagramreels';
  if (['youtube', 'yt', 'youtubevideo', 'ytvideo', 'youtubevideos'].includes(v)) return 'youtubevideo';
  if (['youtubeshort', 'youtubeshot', 'youtubeshorts', 'videoshot', 'ytshort', 'ytshorts'].includes(v))
    return 'youtubeshort';
  if (['tiktok', 'tt'].includes(v)) return 'tiktok';
  return v;
}

function resolveInfluencerPlatform(platformValue, influencerUrl) {
  const normalized = normalizePlatform(platformValue);
  const url = String(influencerUrl || '').toLowerCase();
  if (normalized === 'youtubevideo' && /(?:youtube\.com|youtu\.be)\/.*\/shorts(?:[/?#]|$)/i.test(url)) return 'youtubeshort';
  return normalized;
}

function inferPlatformFromInfluencerUrl(influencerUrl) {
  const url = String(influencerUrl || '').toLowerCase();
  if (url.includes('instagram.com')) return 'instagramreels';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return resolveInfluencerPlatform('youtube', url);
  return '';
}

function normalizePostUrl(rawUrl) {
  const s = String(rawUrl || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    u.hash = '';
    // Keep only the key id param for youtube links; drop noise params.
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') {
      const v = u.searchParams.get('v') || '';
      u.search = v ? `?v=${v}` : '';
    } else {
      u.search = '';
    }
    const path = u.pathname.replace(/\/+$/, '');
    return `${u.protocol}//${u.host}${path}${u.search}`.toLowerCase();
  } catch (_e) {
    return s.replace(/\/+$/, '').toLowerCase();
  }
}

function buildVideoDedupKey({ platform, postId, postUrl }) {
  const p = normalizePlatform(platform);
  const id = String(postId || '').trim();
  if (p && id) return `${p}__${id}`;
  const url = normalizePostUrl(postUrl);
  return url ? `${p || 'unknown'}__url__${url}` : '';
}

function normalizeCreatorName(value) {
  return String(value || '').trim().toLowerCase();
}

function syncFollowerCountToLocalInfluencerRows(localInfluencers, { creatorName, platform, followerCount }) {
  const count = toNumber(followerCount, 0);
  if (!Array.isArray(localInfluencers) || count <= 0) return 0;

  const creatorKey = normalizeCreatorName(creatorName);
  const normalizedPlatform = normalizePlatform(platform);
  const platformFamily = ['youtubevideo', 'youtubeshort'].includes(normalizedPlatform)
    ? new Set(['youtubevideo', 'youtubeshort'])
    : new Set([normalizedPlatform]);

  let updated = 0;
  for (const row of localInfluencers) {
    const fields = row.fields || row;
    const rowCreatorKey = normalizeCreatorName(fields['红人名称']);
    const rowPlatform = normalizePlatform(readSelectText(fields['平台']) || fields.platform || inferPlatformFromInfluencerUrl(readLinkCell(fields['红人链接'])));
    if (!creatorKey || rowCreatorKey !== creatorKey) continue;
    if (normalizedPlatform && rowPlatform && !platformFamily.has(rowPlatform)) continue;

    const previous = toNumber(fields['红人粉丝数据'], 0);
    if (count > previous) {
      fields['红人粉丝数据'] = count;
      row.updatedAt = new Date().toISOString();
      updated += 1;
    }
  }
  return updated;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getInfluencerTier(followers) {
  if (!Number.isFinite(followers) || followers <= 0) return { key: 'unknown', label: '待补充', min: null, max: null };
  if (followers >= 500000) return { key: 'head', label: '头部红人', min: 500000, max: null };
  if (followers >= 100000) return { key: 'waist', label: '腰部红人', min: 100000, max: 499999 };
  if (followers >= 10000) return { key: 'tail', label: '尾部红人', min: 10000, max: 99999 };
  return { key: 'micro', label: '微型红人', min: 0, max: 9999 };
}

function createTierSummary(key, label, range) {
  return { key, label, range, creators: 0, videos: 0, views: 0, likes: 0, comments: 0, avgViews: 0, topCreator: '' };
}

function createTierSummaries() {
  return [
    createTierSummary('head', '头部红人', '≥ 50 万粉丝'),
    createTierSummary('waist', '腰部红人', '10 万 - 49.9 万粉丝'),
    createTierSummary('tail', '尾部红人', '1 万 - 9.9 万粉丝'),
    createTierSummary('micro', '微型红人', '< 1 万粉丝')
  ];
}

function buildTierBreakdown(videos, creatorStats) {
  const scopedCreators = new Map();
  for (const video of videos || []) {
    const base = creatorStats.get(video.creator) || {};
    if (!scopedCreators.has(video.creator)) {
      const followers = Math.max(base.followers || 0, video.followers || 0);
      const tier = getInfluencerTier(followers);
      scopedCreators.set(video.creator, {
        creator: video.creator,
        followers,
        tier: tier.key,
        tierLabel: tier.label,
        videos: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      });
    }
    const stats = scopedCreators.get(video.creator);
    stats.videos += 1;
    stats.views += video.views;
    stats.likes += video.likes;
    stats.comments += video.comments;
    stats.shares += video.shares;
  }

  const tiers = createTierSummaries();
  const tierMap = new Map(tiers.map((tier) => [tier.key, tier]));
  for (const creator of scopedCreators.values()) {
    const tier = tierMap.get(creator.tier);
    if (!tier) continue;
    tier.creators += 1;
    tier.videos += creator.videos;
    tier.views += creator.views;
    tier.likes += creator.likes;
    tier.comments += creator.comments;
    if (!tier.topCreator || creator.views > (scopedCreators.get(tier.topCreator)?.views || 0)) tier.topCreator = creator.creator;
  }
  for (const tier of tiers) tier.avgViews = tier.videos ? Math.round(tier.views / tier.videos) : 0;
  return tiers;
}

function buildDingTalkDashboard({ influencerRecords, videoRecords, snapshotRecords, weeks = 8 }) {
  const latestSnapshotByPostKey = new Map();
  const latest7dSnapshotByPostKey = new Map();
  for (const record of snapshotRecords || []) {
    const fields = record.fields || {};
    const postKey = String(fields.postKey || '').trim();
    if (!postKey) continue;
    const capturedAt = toNumber(fields.capturedAt, 0);
    const existing = latestSnapshotByPostKey.get(postKey);
    if (!existing || capturedAt >= existing.capturedAt) latestSnapshotByPostKey.set(postKey, { capturedAt, fields });
    if (String(fields.snapshotType || '').trim() === 'milestone_7d') {
      const existing7d = latest7dSnapshotByPostKey.get(postKey);
      if (!existing7d || capturedAt >= existing7d.capturedAt) latest7dSnapshotByPostKey.set(postKey, { capturedAt, fields });
    }
  }

  const followerByCreator = new Map();
  for (const record of influencerRecords || []) {
    const fields = record.fields || {};
    const creator = normalizeCreatorName(fields['红人名称']);
    if (!creator) continue;
    const followers = toNumber(fields['红人粉丝数据'], 0);
    followerByCreator.set(creator, Math.max(followerByCreator.get(creator) || 0, followers));
  }

  const videosByKey = new Map();
  for (const record of videoRecords || []) {
    const fields = record.fields || {};
    const platform = normalizePlatform(readSelectText(fields['平台']));
    const postId = normalizeText(fields.id || '', 100);
    const postUrl = readLinkCell(fields.url);
    const publishedAt = parseDateSafe(fields.timestamp);
    const creator = normalizeCreatorName(fields['红人名称']);
    const dedupKey = buildVideoDedupKey({ platform, postId, postUrl });
    if (!creator || !platform || !postUrl || !publishedAt || !dedupKey) continue;
    const postKey = postId ? `${platform}_${postId}` : `${platform}_${postUrl}`;
    const snapshot = latestSnapshotByPostKey.get(postKey)?.fields || {};
    const milestone7dSnapshot = latest7dSnapshotByPostKey.get(postKey)?.fields || {};
    const views = Math.max(toNumber(fields.videoPlayCount, 0), toNumber(fields.videoViewCount, 0), toNumber(snapshot.videoPlayCount, 0), toNumber(snapshot.videoViewCount, 0));
    const mature7dViews = Math.max(toNumber(milestone7dSnapshot.videoPlayCount, 0), toNumber(milestone7dSnapshot.videoViewCount, 0));
    const likes = Math.max(toNumber(fields.likesCount, 0), toNumber(snapshot.likesCount, 0));
    const comments = Math.max(toNumber(fields.commentsCount, 0), toNumber(snapshot.commentsCount, 0));
    const shares = Math.max(toNumber(snapshot.sharesCount, 0), 0);
    const followers = followerByCreator.get(creator) || 0;
    const tier = getInfluencerTier(followers);
    videosByKey.set(dedupKey, {
      creator,
      platform,
      postId,
      postUrl,
      publishedAt,
      followers,
      tier: tier.key,
      tierLabel: tier.label,
      views,
      mature7dViews,
      likes,
      comments,
      shares,
      engagementRate: views > 0 ? Number((((likes + comments + shares) / views) * 100).toFixed(2)) : 0
    });
  }

  const videos = [...videosByKey.values()];
  const creatorStats = new Map();
  for (const video of videos) {
    if (!creatorStats.has(video.creator)) {
      creatorStats.set(video.creator, {
        creator: video.creator,
        followers: video.followers,
        tier: video.tier,
        tierLabel: video.tierLabel,
        videos: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      });
    }
    const stats = creatorStats.get(video.creator);
    stats.followers = Math.max(stats.followers, video.followers);
    stats.tier = getInfluencerTier(stats.followers).key;
    stats.tierLabel = getInfluencerTier(stats.followers).label;
    stats.videos += 1;
    stats.views += video.views;
    stats.likes += video.likes;
    stats.comments += video.comments;
    stats.shares += video.shares;
  }

  const weekCount = Math.max(1, Math.min(16, positiveInt(weeks, 8)));
  const { weekStart: currentWeekStart, weekEnd: currentWeekEnd } = completedReportWeekBounds();
  const currentMonthStart = startOfMonth();
  const weekly = [];
  for (let index = weekCount - 1; index >= 0; index -= 1) {
    const start = new Date(currentWeekStart.getTime() - index * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    const rows = videos.filter((video) => video.publishedAt >= start && video.publishedAt < end);
    weekly.push({
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      videos: rows.length,
      creators: new Set(rows.map((video) => video.creator)).size,
      views: rows.reduce((sum, video) => sum + video.views, 0),
      mature7dViews: rows.reduce((sum, video) => sum + video.mature7dViews, 0),
      mature7dVideos: rows.filter((video) => video.mature7dViews > 0).length
    });
  }

  const monthly = [];
  for (let index = 5; index >= 0; index -= 1) {
    const start = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - index, 1, 0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, 0);
    const rows = videos.filter((video) => video.publishedAt >= start && video.publishedAt < end);
    monthly.push({
      monthStart: start.toISOString(),
      monthEnd: end.toISOString(),
      videos: rows.length,
      creators: new Set(rows.map((video) => video.creator)).size,
      views: rows.reduce((sum, video) => sum + video.views, 0),
      mature7dViews: rows.reduce((sum, video) => sum + video.mature7dViews, 0),
      mature7dVideos: rows.filter((video) => video.mature7dViews > 0).length
    });
  }

  const currentMonthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1, 0, 0, 0, 0);
  const thisWeekVideos = videos.filter((video) => video.publishedAt >= currentWeekStart && video.publishedAt < currentWeekEnd);
  const thisWeekCreators = new Set(thisWeekVideos.map((video) => video.creator));
  const thisMonthVideos = videos.filter((video) => video.publishedAt >= currentMonthStart && video.publishedAt < currentMonthEnd);
  const thisMonthCreators = new Set(thisMonthVideos.map((video) => video.creator));
  const creators = [...creatorStats.values()];
  const tierBreakdowns = {
    week: buildTierBreakdown(thisWeekVideos, creatorStats),
    month: buildTierBreakdown(thisMonthVideos, creatorStats),
    total: buildTierBreakdown(videos, creatorStats)
  };
  const tiers = tierBreakdowns.total;

  const creatorLeaderboard = creators
    .map((creator) => ({
      ...creator,
      avgViews: creator.videos ? Math.round(creator.views / creator.videos) : 0,
      engagementRate: creator.views ? Number((((creator.likes + creator.comments + creator.shares) / creator.views) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.views - a.views || b.videos - a.videos)
    .slice(0, 10);
  const videoLeaderboard = videos
    .sort((a, b) => b.views - a.views || b.engagementRate - a.engagementRate)
    .slice(0, 10)
    .map((video, index) => ({ ...video, rank: index + 1, publishedAt: video.publishedAt.toISOString() }));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCreators: creators.length,
      totalVideos: videos.length,
      totalViews: videos.reduce((sum, video) => sum + video.views, 0),
      totalMature7dViews: videos.reduce((sum, video) => sum + video.mature7dViews, 0),
      thisWeekVideos: thisWeekVideos.length,
      thisWeekCreators: thisWeekCreators.size,
      thisWeekViews: thisWeekVideos.reduce((sum, video) => sum + video.views, 0),
      thisWeekMature7dViews: thisWeekVideos.reduce((sum, video) => sum + video.mature7dViews, 0),
      thisMonthVideos: thisMonthVideos.length,
      thisMonthCreators: thisMonthCreators.size,
      thisMonthViews: thisMonthVideos.reduce((sum, video) => sum + video.views, 0),
      thisMonthMature7dViews: thisMonthVideos.reduce((sum, video) => sum + video.mature7dViews, 0),
      missingFollowerCreators: creators.filter((creator) => creator.tier === 'unknown').length
    },
    currentWeek: { weekStart: currentWeekStart.toISOString(), weekEnd: currentWeekEnd.toISOString() },
    currentMonth: { monthStart: currentMonthStart.toISOString(), monthEnd: currentMonthEnd.toISOString() },
    weekly,
    monthly,
    tierBreakdowns,
    tiers,
    creatorLeaderboard,
    videoLeaderboard
  };
}

let dingTalkAccessTokenCache = { cacheKey: '', token: '', expiresAt: 0 };

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function withTimeout(action, timeoutMs, message) {
  let timeout;
  try {
    return await Promise.race([
      action(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function dingTalkGetAccessToken({ appKey, appSecret }) {
  const cacheKey = `${appKey}:${appSecret}`;
  if (dingTalkAccessTokenCache.cacheKey === cacheKey && dingTalkAccessTokenCache.token && dingTalkAccessTokenCache.expiresAt > Date.now() + 60000) {
    return dingTalkAccessTokenCache.token;
  }
  const url = `https://oapi.dingtalk.com/gettoken?appkey=${encodeURIComponent(appKey)}&appsecret=${encodeURIComponent(appSecret)}`;
  let res;
  try {
    res = await fetchWithTimeout(url);
  } catch (e) {
    throw new Error(`DingTalk token network failed: ${e.message || e}`);
  }
  const json = await res.json();
  if (json.errcode !== 0 || !json.access_token) {
    throw new Error(`DingTalk auth failed: ${json.errmsg || json.errcode}`);
  }
  dingTalkAccessTokenCache = {
    cacheKey,
    token: json.access_token,
    expiresAt: Date.now() + Math.max(300, Number(json.expires_in) || 7200) * 1000
  };
  return json.access_token;
}

async function dingTalkResolveOperatorUnionId({ accessToken, operatorId }) {
  const raw = String(operatorId || '').trim();
  if (!raw) return '';
  // User IDs are numeric in older orgs and numeric-with-hyphen in newer orgs.
  // Other non-empty values are already union IDs and can be used directly.
  if (!/^\d+(?:-\d+)?$/.test(raw)) return raw;
  const url = `https://oapi.dingtalk.com/topapi/v2/user/get?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userid: raw })
  });
  const json = await res.json();
  if (json.errcode !== 0) {
    throw new Error(`DingTalk resolve operator failed: ${json.errmsg || json.errcode}`);
  }
  return String(json.result?.unionid || raw).trim();
}

async function dingTalkListFields({ accessToken, baseId, sheetId, operatorId }) {
  const url = `https://api.dingtalk.com/v1.0/notable/bases/${encodeURIComponent(baseId)}/sheets/${encodeURIComponent(
    sheetId
  )}/fields?operatorId=${encodeURIComponent(operatorId)}`;
  let res;
  try {
    res = await fetchWithTimeout(url, { headers: { 'x-acs-dingtalk-access-token': accessToken } });
  } catch (e) {
    throw new Error(`DingTalk list fields network failed(${sheetId}): ${url} ; ${e.message || e}`);
  }
  const json = await res.json();
  if (!res.ok) throw new Error(`DingTalk list fields failed(${sheetId}): ${json.message || res.status}`);
  return json.value || [];
}

async function dingTalkListRecords({ accessToken, baseId, sheetId, operatorId, maxResults = 100, timeoutMs = 8000 }) {
  const all = [];
  const seenNextTokens = new Set();
  let nextToken = '';
  while (true) {
    const qs = new URLSearchParams({
      operatorId,
      maxResults: String(Math.max(1, Math.min(100, Number(maxResults) || 100)))
    });
    if (nextToken) qs.set('nextToken', nextToken);
    const url = `https://api.dingtalk.com/v1.0/notable/bases/${encodeURIComponent(baseId)}/sheets/${encodeURIComponent(
      sheetId
    )}/records?${qs.toString()}`;
    let res;
    try {
      res = await fetchWithTimeout(url, { headers: { 'x-acs-dingtalk-access-token': accessToken } }, timeoutMs);
    } catch (e) {
      throw new Error(`DingTalk list records network failed(${sheetId}): ${url} ; ${e.message || e}`);
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`DingTalk list records failed(${sheetId}): ${json.message || res.status}`);
    all.push(...(json.records || []));
    if (!json.hasMore || !json.nextToken) break;
    if (seenNextTokens.has(json.nextToken)) throw new Error(`DingTalk list records pagination loop detected(${sheetId})`);
    seenNextTokens.add(json.nextToken);
    nextToken = json.nextToken;
  }
  return all;
}

async function dingTalkPingSheet({ accessToken, baseId, sheetId, operatorId }) {
  const qs = new URLSearchParams({ operatorId, maxResults: '1' });
  const url = `https://api.dingtalk.com/v1.0/notable/bases/${encodeURIComponent(baseId)}/sheets/${encodeURIComponent(
    sheetId
  )}/records?${qs.toString()}`;
  let res;
  try {
    res = await fetchWithTimeout(url, { headers: { 'x-acs-dingtalk-access-token': accessToken } }, 3500);
  } catch (e) {
    throw new Error(`DingTalk ping sheet network failed(${sheetId}): ${e.message || e}`);
  }
  const json = await res.json();
  if (!res.ok) throw new Error(`DingTalk ping sheet failed(${sheetId}): ${json.message || res.status}`);
  return { sheetId, accessible: true };
}

async function retryDingTalkRead(action, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

function shouldRetryDingTalkWrite(status) {
  return status === 429 || status >= 500;
}

async function dingTalkWriteJsonWithRetry({ url, options, actionLabel, attempts = 3 }) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let res;
    try {
      res = await fetchWithTimeout(url, options);
    } catch (error) {
      lastError = new Error(`${actionLabel} network failed: ${error.message || error}`);
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        continue;
      }
      throw lastError;
    }

    const json = await res.json().catch(() => ({}));
    if (res.ok) return json;
    lastError = new Error(`${actionLabel} failed: ${json.message || res.status}`);
    if (!shouldRetryDingTalkWrite(res.status) || attempt >= attempts) throw lastError;
    const retryAfterSeconds = Math.max(0, Number(res.headers.get('retry-after')) || 0);
    await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfterSeconds * 1000, attempt * 1500)));
  }
  throw lastError;
}

async function dingTalkCreateRecords({ accessToken, baseId, sheetId, operatorId, records }) {
  const url = `https://api.dingtalk.com/v1.0/notable/bases/${encodeURIComponent(baseId)}/sheets/${encodeURIComponent(
    sheetId
  )}/records?operatorId=${encodeURIComponent(operatorId)}`;
  const json = await dingTalkWriteJsonWithRetry({
    url,
    actionLabel: `DingTalk create records(${sheetId})`,
    options: {
      method: 'POST',
      headers: { 'x-acs-dingtalk-access-token': accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    }
  });
  return json.value || [];
}

async function dingTalkUpdateRecord({ accessToken, baseId, sheetId, operatorId, recordId, fields }) {
  const url = `https://api.dingtalk.com/v1.0/notable/bases/${encodeURIComponent(baseId)}/sheets/${encodeURIComponent(
    sheetId
  )}/records?operatorId=${encodeURIComponent(operatorId)}`;
  const json = await dingTalkWriteJsonWithRetry({
    url,
    actionLabel: `DingTalk update records(${sheetId})`,
    options: {
      method: 'PUT',
      headers: { 'x-acs-dingtalk-access-token': accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ id: recordId, fields }] })
    }
  });
  return json.value || {};
}

function normalizeDingTalkFieldValue(fieldName, value, fieldType) {
  if (value === undefined || value === null || value === '') return null;
  if (fieldType === 'url') {
    const link = readLinkCell(value) || String(value);
    if (!link) return null;
    return { text: link, link };
  }
  if (fieldType === 'singleSelect') {
    return typeof value === 'object' && value ? readSelectText(value) : String(value);
  }
  if (fieldType === 'number') {
    const n = toNumber(value, NaN);
    return Number.isFinite(n) ? n : null;
  }
  if (fieldType === 'date') {
    if (typeof value === 'number') return value;
    const d = parseDateSafe(value);
    return d ? d.getTime() : null;
  }
  return String(value);
}

function normalizeDingTalkFieldsBySchema(fields, fieldTypeMap) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (!fieldTypeMap.has(k)) continue;
    const normalized = normalizeDingTalkFieldValue(k, v, fieldTypeMap.get(k));
    if (normalized !== null && normalized !== undefined) out[k] = normalized;
  }
  return out;
}

function buildPublishedVideoStatusFields(status, fieldTypeMap) {
  const fields = {};
  for (const name of ['是否发布视频', '是否出视频']) {
    if (fieldTypeMap.has(name)) fields[name] = status;
  }
  return fields;
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
  const keywords = [];
  const windowEnd = new Date(8640000000000000);
  const days = 200000000;
  if (platform === 'tiktok') return cleanTikTokItem(item, keywords, windowEnd, days).cleaned;
  if (platform === 'youtubevideo' || platform === 'youtubeshort') {
    return cleanYouTubeItem(item, keywords, windowEnd, days, platform).cleaned;
  }
  return cleanItem(item, 'instagram', keywords, windowEnd, days).cleaned;
}

function findMilestoneItem(platform, items, targetUrl) {
  const normalizedTarget = normalizePostUrl(targetUrl);
  const rows = (items || []).map((item) => ({ item, cleaned: normalizeMilestoneItem(platform, item) }));
  return (
    rows.find(({ cleaned }) => normalizePostUrl(cleaned.postUrl) === normalizedTarget) ||
    (rows.length === 1 ? rows[0] : null)
  );
}

app.get('/api/workflow/dingtalk-status', async (_req, res) => {
  const startedAt = Date.now();
  try {
    const appKey = process.env.DINGTALK_APP_KEY;
    const appSecret = process.env.DINGTALK_APP_SECRET;
    const baseId = process.env.DINGTALK_DOC_ID;
    const influencerTableId = process.env.DINGTALK_INFLUENCER_TABLE_ID;
    const videoTableId = process.env.DINGTALK_VIDEO_TABLE_ID;
    const snapshotTableId = process.env.DINGTALK_SNAPSHOT_TABLE_ID;
    const operatorId = process.env.DINGTALK_OPERATOR_ID;
    if (!appKey || !appSecret || !baseId || !influencerTableId || !videoTableId || !snapshotTableId || !operatorId) {
      return res.status(400).json({ ok: false, error: '钉钉连接配置不完整。' });
    }

    const accessToken = await retryDingTalkRead(() => dingTalkGetAccessToken({ appKey, appSecret }), 2);
    const resolvedOperatorId = await retryDingTalkRead(() => dingTalkResolveOperatorUnionId({ accessToken, operatorId }), 2);
    const tables = await Promise.all(
      [influencerTableId, videoTableId, snapshotTableId].map((sheetId) =>
        retryDingTalkRead(() => dingTalkPingSheet({ accessToken, baseId, sheetId, operatorId: resolvedOperatorId }), 2)
      )
    );
    return res.json({
      ok: true,
      message: '钉钉连接正常。',
      elapsedMs: Date.now() - startedAt,
      tables
    });
  } catch (error) {
    return res.status(504).json({ ok: false, error: error.message || '钉钉连接检查超时。', elapsedMs: Date.now() - startedAt });
  }
});

app.post('/api/workflow/backfill-published-status', async (_req, res) => {
  try {
    const appKey = process.env.DINGTALK_APP_KEY;
    const appSecret = process.env.DINGTALK_APP_SECRET;
    const baseId = process.env.DINGTALK_DOC_ID;
    const influencerTableId = process.env.DINGTALK_INFLUENCER_TABLE_ID;
    const videoTableId = process.env.DINGTALK_VIDEO_TABLE_ID;
    const operatorId = process.env.DINGTALK_OPERATOR_ID;
    if (!appKey || !appSecret || !baseId || !influencerTableId || !videoTableId || !operatorId) {
      return res.status(400).json({ ok: false, error: '钉钉配置不完整。' });
    }

    const accessToken = await dingTalkGetAccessToken({ appKey, appSecret });
    const resolvedOperatorId = await dingTalkResolveOperatorUnionId({ accessToken, operatorId });
    const [influencerFields, influencerRecords, videoRecords] = await Promise.all([
      dingTalkListFields({ accessToken, baseId, sheetId: influencerTableId, operatorId: resolvedOperatorId }),
      dingTalkListRecords({ accessToken, baseId, sheetId: influencerTableId, operatorId: resolvedOperatorId }),
      dingTalkListRecords({ accessToken, baseId, sheetId: videoTableId, operatorId: resolvedOperatorId })
    ]);
    const influencerFieldTypeMap = new Map(influencerFields.map((f) => [f.name, f.type]));
    const statusFieldNames = ['是否发布视频', '是否出视频'].filter((name) => influencerFieldTypeMap.has(name));
    if (!statusFieldNames.length) return res.status(400).json({ ok: false, error: '达人表缺少“是否发布视频/是否出视频”字段。' });

    const registeredVideoCreatorPlatforms = new Set();
    for (const record of videoRecords) {
      const fields = record.fields || {};
      const creator = normalizeCreatorName(fields['红人名称']);
      const platform = normalizePlatform(readSelectText(fields['平台']));
      if (creator && platform) registeredVideoCreatorPlatforms.add(`${creator}__${platform}`);
    }

    let updated = 0;
    let yes = 0;
    let no = 0;
    for (const record of influencerRecords) {
      const fields = record.fields || {};
      const platform = resolveInfluencerPlatform(readSelectText(fields.平台), readLinkCell(fields['红人链接']));
      const creator = normalizeCreatorName(fields['红人名称']);
      const existingUrls = [readLinkCell(fields.url), readLinkCell(fields.url2), readLinkCell(fields.url3)].filter(Boolean);
      const hasPublished =
        existingUrls.length > 0 || Boolean(creator && platform && registeredVideoCreatorPlatforms.has(`${creator}__${platform}`));
      const targetStatus = hasPublished ? '是' : '否';
      if (hasPublished) yes += 1;
      else no += 1;

      const needsUpdate = statusFieldNames.some((name) => (readSelectText(fields[name]) || String(fields[name] || '').trim()) !== targetStatus);
      if (!needsUpdate) continue;

      const updateFields = normalizeDingTalkFieldsBySchema(
        Object.fromEntries(statusFieldNames.map((name) => [name, targetStatus])),
        influencerFieldTypeMap
      );
      if (!Object.keys(updateFields).length) continue;
      await dingTalkUpdateRecord({
        accessToken,
        baseId,
        sheetId: influencerTableId,
        operatorId: resolvedOperatorId,
        recordId: record.id,
        fields: updateFields
      });
      updated += 1;
    }

    return res.json({ ok: true, message: '是否发布视频状态已回填。', fields: statusFieldNames, rows: influencerRecords.length, updated, yes, no });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '是否发布视频状态回填失败。' });
  }
});

app.get('/api/workflow/dashboard', async (req, res) => {
  const cachedDashboard = await loadDingTalkDashboardCache();
  if (cachedDashboard && req.query.refresh !== '1') {
    return res.json({ ok: true, dashboard: cachedDashboard, cached: true });
  }
  try {
    const appKey = process.env.DINGTALK_APP_KEY;
    const appSecret = process.env.DINGTALK_APP_SECRET;
    const baseId = process.env.DINGTALK_DOC_ID;
    const influencerTableId = process.env.DINGTALK_INFLUENCER_TABLE_ID;
    const videoTableId = process.env.DINGTALK_VIDEO_TABLE_ID;
    const snapshotTableId = process.env.DINGTALK_SNAPSHOT_TABLE_ID;
    const operatorId = process.env.DINGTALK_OPERATOR_ID;
    if (!appKey || !appSecret || !baseId || !influencerTableId || !videoTableId || !snapshotTableId || !operatorId) {
      return res.status(400).json({ ok: false, error: '钉钉仪表盘配置不完整。' });
    }

    const dashboard = await withTimeout(async () => {
      const accessToken = await retryDingTalkRead(() => dingTalkGetAccessToken({ appKey, appSecret }), 1);
      const resolvedOperatorId = await retryDingTalkRead(() => dingTalkResolveOperatorUnionId({ accessToken, operatorId }), 1);
      const [influencerRecords, videoRecords, snapshotRecords] = await Promise.all([
        retryDingTalkRead(() => dingTalkListRecords({ accessToken, baseId, sheetId: influencerTableId, operatorId: resolvedOperatorId, timeoutMs: 12000 }), 1),
        retryDingTalkRead(() => dingTalkListRecords({ accessToken, baseId, sheetId: videoTableId, operatorId: resolvedOperatorId, timeoutMs: 12000 }), 1),
        retryDingTalkRead(() => dingTalkListRecords({ accessToken, baseId, sheetId: snapshotTableId, operatorId: resolvedOperatorId, timeoutMs: 12000 }), 1)
      ]);
      const refreshed = buildDingTalkDashboard({ influencerRecords, videoRecords, snapshotRecords, weeks: req.query.weeks });
      await saveDingTalkDashboardCache(refreshed);
      return refreshed;
    }, 30000, '钉钉完整数据读取超时。');
    return res.json({ ok: true, dashboard, cached: false });
  } catch (error) {
    if (cachedDashboard) {
      return res.json({ ok: true, dashboard: cachedDashboard, cached: true, warning: '钉钉网络暂时较慢，当前展示最近一次成功读取的数据。' });
    }
    return res.status(500).json({ ok: false, error: error.message || '仪表盘读取失败。' });
  }
});

app.get('/api/local/collections', async (_req, res) => {
  try {
    const store = await readLocalDataStore();
    return res.json({
      ok: true,
      counts: {
        influencers: store.influencers.length,
        videos: store.videos.length,
        snapshots: store.snapshots.length,
        runs: store.runs.length,
        affiliateSales: store.affiliateSales.length
      },
      collections: store
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '本地中台数据读取失败。' });
  }
});

app.get('/api/local/dashboard', async (req, res) => {
  try {
    const store = await readLocalDataStore();
    const dashboard = buildDingTalkDashboard({
      influencerRecords: localRowsToRecords(store.influencers),
      videoRecords: localRowsToRecords(store.videos),
      snapshotRecords: localRowsToRecords(store.snapshots),
      weeks: req.query.weeks || 8
    });
    return res.json({ ok: true, dashboard, source: 'local' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '本地仪表盘生成失败。' });
  }
});

app.post('/api/local/import-dingtalk', async (_req, res) => {
  try {
    const appKey = process.env.DINGTALK_APP_KEY;
    const appSecret = process.env.DINGTALK_APP_SECRET;
    const baseId = process.env.DINGTALK_DOC_ID;
    const influencerTableId = process.env.DINGTALK_INFLUENCER_TABLE_ID;
    const videoTableId = process.env.DINGTALK_VIDEO_TABLE_ID;
    const snapshotTableId = process.env.DINGTALK_SNAPSHOT_TABLE_ID;
    const operatorId = process.env.DINGTALK_OPERATOR_ID;
    if (!appKey || !appSecret || !baseId || !influencerTableId || !videoTableId || !snapshotTableId || !operatorId) {
      return res.status(400).json({ ok: false, error: '钉钉配置不完整，无法导入本地中台。' });
    }
    const accessToken = await dingTalkGetAccessToken({ appKey, appSecret });
    const resolvedOperatorId = await dingTalkResolveOperatorUnionId({ accessToken, operatorId });
    const [influencers, videos, snapshots] = await Promise.all([
      dingTalkListRecords({ accessToken, baseId, sheetId: influencerTableId, operatorId: resolvedOperatorId, timeoutMs: 15000 }),
      dingTalkListRecords({ accessToken, baseId, sheetId: videoTableId, operatorId: resolvedOperatorId, timeoutMs: 15000 }),
      dingTalkListRecords({ accessToken, baseId, sheetId: snapshotTableId, operatorId: resolvedOperatorId, timeoutMs: 15000 })
    ]);
    await Promise.all([
      writeJsonArray(LOCAL_DATA_FILES.influencers, influencers.map((record) => ({ id: record.id, fields: record.fields || {}, source: 'dingtalk', importedAt: new Date().toISOString() }))),
      writeJsonArray(LOCAL_DATA_FILES.videos, videos.map((record) => ({ id: record.id, fields: record.fields || {}, source: 'dingtalk', importedAt: new Date().toISOString() }))),
      writeJsonArray(LOCAL_DATA_FILES.snapshots, snapshots.map((record) => ({ id: record.id, fields: record.fields || {}, source: 'dingtalk', importedAt: new Date().toISOString() })))
    ]);
    return res.json({
      ok: true,
      message: '钉钉数据已导入本地中台。',
      counts: { influencers: influencers.length, videos: videos.length, snapshots: snapshots.length }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '钉钉导入本地中台失败。' });
  }
});

app.post('/api/local/influencers/import', async (req, res) => {
  try {
    const { text = '', rows = [] } = req.body || {};
    const rawRows = Array.isArray(rows) && rows.length
      ? rows
      : String(text || '')
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((url) => ({ url }));
    const store = await readLocalDataStore();
    const existingKeys = new Set(
      store.influencers
        .map((row) => readLinkCell((row.fields || row)['红人链接']) || (row.fields || row).url)
        .map((url) => normalizePostUrl(url))
        .filter(Boolean)
    );
    const imported = [];
    for (const row of rawRows) {
      const url = String(row.url || row['红人链接'] || '').trim();
      if (!url) continue;
      const key = normalizePostUrl(url);
      if (!key || existingKeys.has(key)) continue;
      const platform =
        resolveInfluencerPlatform(row.platform || row['平台'] || '', url) ||
        inferPlatformFromInfluencerUrl(url) ||
        normalizePlatform(row.platform || row['平台']);
      const fields = {
        红人名称: normalizeText(row.name || row['红人名称'] || inferInfluencerNameFromUrl(url), 200),
        平台: platform,
        红人链接: { text: url, link: url },
        是否监控: row.monitor || row['是否监控'] || '是',
        是否出视频: row.published || row['是否出视频'] || '否',
        红人粉丝数据: toNumber(row.followers || row['红人粉丝数据'], 0) || ''
      };
      imported.push({ id: makeLocalId('inf'), fields, source: 'local-import', importedAt: new Date().toISOString() });
      existingKeys.add(key);
    }
    await writeJsonArray(LOCAL_DATA_FILES.influencers, [...store.influencers, ...imported]);
    return res.json({ ok: true, message: '红人主页链接已导入本地中台。', imported: imported.length, total: store.influencers.length + imported.length });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '红人导入失败。' });
  }
});

app.get('/api/local/templates/video-import.csv', (_req, res) => {
  const rows = [
    ['视频链接（必填）', '红人名称（可选）', '平台（可选，可自动识别）', '上线时间（可选）', '是否监控（可选）', '备注（可选）'],
    ['https://www.tiktok.com/@example/video/1234567890', '', '', '', '是', '只需要填写第一列也可以导入'],
    ['https://www.youtube.com/shorts/abcdefghijk', '', '', '', '是', 'YouTube Shorts 会自动识别'],
    ['https://www.instagram.com/reel/ABC123/', '', '', '', '是', 'Instagram Reels 会自动识别']
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="video-import-template.csv"');
  return res.send(`\uFEFF${csv}`);
});

app.get('/api/local/templates/video-import.xlsx', (_req, res) => {
  return res.download(path.join(__dirname, 'data', 'templates', 'video-import-template.xlsx'), 'video-import-template.xlsx');
});

app.post('/api/local/videos/import', async (req, res) => {
  try {
    const { text = '', rows = [] } = req.body || {};
    const rawRows = Array.isArray(rows) && rows.length
      ? rows
      : String(text || '')
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((url) => ({ url }));
    const store = await readLocalDataStore();
    const existingKeys = new Set(
      store.videos
        .flatMap((row) => {
          const fields = row.fields || row;
          const platform = readSelectText(fields['平台']) || fields.platform;
          const postUrl = readLinkCell(fields.url) || fields.url;
          return [
            buildVideoDedupKey({ platform, postId: fields.id, postUrl }),
            buildVideoDedupKey({ platform, postId: '', postUrl })
          ];
        })
        .filter(Boolean)
    );
    const imported = [];
    const skipped = [];
    for (const row of rawRows) {
      const url = String(row.url || row['视频链接'] || row['视频链接（必填）'] || row.videoUrl || row.link || '').trim();
      if (!url) continue;
      const platform = normalizePlatform(row.platform || row['平台'] || row['平台（可选，可自动识别）']) || inferPlatformFromVideoUrl(url);
      const postId = normalizeText(row.id || row.videoId || row['视频ID'] || extractVideoIdFromUrl(url, platform), 100);
      const dedupKey = buildVideoDedupKey({ platform, postId, postUrl: url });
      if (!platform) {
        skipped.push({ url, reason: '无法识别平台' });
        continue;
      }
      if (!dedupKey || existingKeys.has(dedupKey)) {
        skipped.push({ url, reason: '重复视频' });
        continue;
      }
      const urlDedupKey = buildVideoDedupKey({ platform, postId: '', postUrl: url });
      if (urlDedupKey && existingKeys.has(urlDedupKey)) {
        skipped.push({ url, reason: '重复视频' });
        continue;
      }
      const creator = normalizeText(row.creator || row.name || row['红人名称'] || row['红人名称（可选）'] || inferCreatorFromVideoUrl(url) || '待匹配达人', 200);
      const timestampRaw = row.timestamp || row['上线时间'] || row['上线时间（可选）'] || '';
      const timestampDate = parseDateSafe(timestampRaw);
      const fields = {
        红人名称: creator,
        平台: platform,
        是否监控: row.monitor || row['是否监控'] || row['是否监控（可选）'] || '是',
        id: postId,
        timestamp: timestampDate ? timestampDate.toISOString() : normalizeText(timestampRaw, 80),
        url: makeLinkCell(url),
        caption: normalizeText(row.caption || row['标题'] || row['备注'] || row['备注（可选）'] || '', 2000),
        commentsCount: toNumber(row.commentsCount || row['评论数'], 0),
        likesCount: toNumber(row.likesCount || row['点赞数'], 0),
        videoViewCount: toNumber(row.videoViewCount || row['观看数'], 0),
        videoPlayCount: toNumber(row.videoPlayCount || row['播放数'], 0),
        videoUrl: normalizeText(row.videoUrl || '', 1000),
        displayUrl: normalizeText(row.displayUrl || '', 1000)
      };
      imported.push({ id: makeLocalId('vid'), fields, source: 'video-link-import', importedAt: new Date().toISOString() });
      existingKeys.add(dedupKey);
      if (urlDedupKey) existingKeys.add(urlDedupKey);
    }
    await writeJsonArray(LOCAL_DATA_FILES.videos, [...store.videos, ...imported]);
    return res.json({
      ok: true,
      message: '视频链接已导入本地视频上线表。',
      imported: imported.length,
      skipped: skipped.length,
      skippedRows: skipped.slice(0, 20),
      total: store.videos.length + imported.length
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '视频链接导入失败。' });
  }
});

function normalizeEditableVideoFields(input = {}) {
  const fields = {};
  const setText = (targetKey, sourceKey = targetKey, max = 1000) => {
    if (Object.prototype.hasOwnProperty.call(input, sourceKey)) fields[targetKey] = normalizeText(input[sourceKey], max);
  };
  setText('红人名称', '红人名称', 200);
  setText('负责人', '负责人', 100);
  setText('地区', '地区', 80);
  setText('caption', 'caption', 2000);
  if (Object.prototype.hasOwnProperty.call(input, '平台')) fields['平台'] = normalizePlatform(input['平台']) || normalizeText(input['平台'], 80);
  if (Object.prototype.hasOwnProperty.call(input, 'timestamp')) {
    const parsed = parseDateSafe(input.timestamp);
    fields.timestamp = parsed ? parsed.toISOString() : normalizeText(input.timestamp, 80);
  }
  ['mature7dViews', 'videoPlayCount', 'videoViewCount', 'likesCount', 'commentsCount'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) fields[key] = toNumber(input[key], 0);
  });
  if (Object.prototype.hasOwnProperty.call(input, 'url')) {
    const url = normalizeText(input.url, 1000);
    fields.url = makeLinkCell(url);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'videoUrl')) fields.videoUrl = normalizeText(input.videoUrl, 1000);
  return fields;
}

app.patch('/api/local/videos/:id', async (req, res) => {
  try {
    const recordId = String(req.params.id || '').trim();
    if (!recordId) return res.status(400).json({ ok: false, error: '缺少视频记录 ID。' });
    const { fields: inputFields = {} } = req.body || {};
    const store = await readLocalDataStore();
    const index = store.videos.findIndex((row, rowIndex) => String(row.id || row.recordId || `local_video_${rowIndex + 1}`) === recordId);
    if (index < 0) return res.status(404).json({ ok: false, error: '没有找到这条视频记录。' });
    const current = store.videos[index] || {};
    const currentFields = current.fields || current;
    const nextFields = {
      ...currentFields,
      ...normalizeEditableVideoFields(inputFields)
    };
    store.videos[index] = {
      ...current,
      id: current.id || recordId,
      fields: nextFields,
      updatedAt: new Date().toISOString(),
      source: current.source || 'local-edit'
    };
    await writeJsonArray(LOCAL_DATA_FILES.videos, store.videos);
    return res.json({ ok: true, record: store.videos[index], total: store.videos.length });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '视频记录更新失败。' });
  }
});

app.delete('/api/local/videos/:id', async (req, res) => {
  try {
    const recordId = String(req.params.id || '').trim();
    if (!recordId) return res.status(400).json({ ok: false, error: '缺少视频记录 ID。' });
    const store = await readLocalDataStore();
    const before = store.videos.length;
    const videos = store.videos.filter((row, rowIndex) => String(row.id || row.recordId || `local_video_${rowIndex + 1}`) !== recordId);
    if (videos.length === before) return res.status(404).json({ ok: false, error: '没有找到这条视频记录。' });
    await writeJsonArray(LOCAL_DATA_FILES.videos, videos);
    return res.json({ ok: true, deleted: before - videos.length, total: videos.length });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '视频记录删除失败。' });
  }
});

app.get('/api/local/export/:collection', async (req, res) => {
  try {
    const collection = req.params.collection;
    const format = String(req.query.format || 'csv').toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(LOCAL_DATA_FILES, collection)) {
      return res.status(404).json({ ok: false, error: '未知本地数据集合。' });
    }
    const rows = await readJsonArray(LOCAL_DATA_FILES[collection]);
    if (format === 'json') return res.json({ ok: true, collection, rows });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${collection}.csv"`);
    return res.send(`\uFEFF${rowsToCsv(rows)}`);
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '导出失败。' });
  }
});

app.get('/api/local/reports/:filename', async (req, res) => {
  try {
    const filename = path.basename(String(req.params.filename || ''));
    if (!/^[\w\u4e00-\u9fa5().\-\s]+\.(csv|xlsx|md|html)$/i.test(filename)) {
      return res.status(400).json({ ok: false, error: '报告文件名不合法。' });
    }
    const filePath = path.join(REPORT_DIR, filename);
    await fs.access(filePath);
    return res.download(filePath, filename);
  } catch (error) {
    return res.status(404).json({ ok: false, error: '报告文件不存在，请先运行合作交付导入脚本。' });
  }
});

app.post('/api/local/discover', async (req, res) => {
  const startedAt = Date.now();
  const runId = `local_discovery_${startedAt}`;
  let acquiredLock = false;
  try {
    const {
      days = 7,
      maxItems = 30,
      globalKeywords = 'yozma,yozmasport',
      limitInfluencers = 1,
      skipInfluencers = 0,
      onlyInfluencerInputs = [],
      platformFilter = 'all',
      publishedBefore = '',
      actorLookbackDays = null,
      includeUnmonitoredTargets = false,
      tiktokApprovalId = '',
      dryRun = false
    } = req.body || {};
    const finalApifyToken = process.env.APIFY_API_TOKEN;
    const supportedPlatforms = new Set(['instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok']);
    const normalizedPlatformFilter = normalizePlatform(platformFilter) || 'all';
    if (normalizedPlatformFilter !== 'all' && !supportedPlatforms.has(normalizedPlatformFilter)) {
      return res.status(400).json({ ok: false, error: '平台筛选只支持 all / instagramreels / youtubevideo / youtubeshort / tiktok。' });
    }
    if (!dryRun && !finalApifyToken) {
      return res.status(400).json({ ok: false, error: 'Apify Token 不能为空。' });
    }
    if (!dryRun) {
      if (localDiscoveryRunning) {
        return res.status(409).json({ ok: false, error: '已有本地抓取任务正在运行，请稍后再试。' });
      }
      localDiscoveryRunning = true;
      acquiredLock = true;
    }

    const store = await readLocalDataStore();
    const crmTargets = await loadCrmMonitorTargets();
    const influencers = store.influencers.map((row, index) => {
      const fields = row.fields || row;
      const homeUrl = readLinkCell(fields['红人链接']);
      const platform = resolveInfluencerPlatform(readSelectText(fields['平台']), homeUrl) || inferPlatformFromInfluencerUrl(homeUrl);
      return { ...row, fields, localIndex: index, platform };
    });
    const candidateAudit = buildLocalCandidateAudit(influencers);
    const onlyInputSet = new Set(
      (Array.isArray(onlyInfluencerInputs) ? onlyInfluencerInputs : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .flatMap((value) => [value, normalizePostUrl(value)])
    );
    const selectedRows = influencers
      .filter((row) => {
        if (isCrmMonitorTarget(row, crmTargets)) return true;
        if (!includeUnmonitoredTargets || !onlyInputSet.size) return false;
        const input = readLinkCell(row.fields['红人链接']) || String(row.fields['红人名称'] || '').trim();
        return onlyInputSet.has(input) || onlyInputSet.has(normalizePostUrl(input));
      })
      .filter((row) => row.fields['红人名称'] || readLinkCell(row.fields['红人链接']))
      .filter((row) => supportedPlatforms.has(row.platform))
      .filter((row) => (normalizedPlatformFilter === 'all' ? true : row.platform === normalizedPlatformFilter));
    const targetedRowsWithDuplicates = onlyInputSet.size
      ? selectedRows.filter((row) => {
          const input = readLinkCell(row.fields['红人链接']) || String(row.fields['红人名称'] || '').trim();
          return onlyInputSet.has(input) || onlyInputSet.has(normalizePostUrl(input));
        })
      : selectedRows;
    const targetedRows = [];
    const targetedKeys = new Set();
    for (const row of targetedRowsWithDuplicates) {
      const input = readLinkCell(row.fields['红人链接']) || String(row.fields['红人名称'] || '').trim();
      const targetKey = `${row.platform}__${normalizePostUrl(input) || normalizeCreatorName(input)}`;
      if (!targetKey || targetedKeys.has(targetKey)) continue;
      targetedKeys.add(targetKey);
      targetedRows.push(row);
    }
    const offset = Math.max(0, Number(skipInfluencers) || 0);
    const limit = Math.max(1, Number(limitInfluencers) || 1);
    const candidates = targetedRows.slice(offset, offset + limit);
    const approvalCandidates = candidates.filter((row) => row.platform === 'tiktok').map((row) => ({
      platform: row.platform,
      input: readLinkCell(row.fields['红人链接']) || String(row.fields['红人名称'] || '').trim()
    }));

    if (dryRun) {
      const usageEstimate = estimateApifyUsageForCandidates(candidates);
      const ledger = await loadBudgetLedger();
      return res.json({
        ok: true,
        dryRun: true,
        message: '本地候选检查完成，未调用 Apify，未写入数据。',
        candidateAudit: {
          ...candidateAudit,
          selectedRows: selectedRows.length,
          targetedRows: targetedRows.length,
          queuedRows: candidates.length,
          contractCompletedStoppedRows: 0,
          manuallyStoppedRows: Number(crmTargets.summary.manuallyStopped || crmTargets.stoppedRows || 0)
        },
        usageEstimate,
        usageBudget: budgetStatus({ ledger }),
        blockedReason: '',
        approvalId: approvalCandidates.length ? createTikTokApproval(approvalCandidates, finalApifyToken || 'missing-token') : '',
        targetSource: { path: CRM_MONITOR_TARGETS_PATH, generatedAt: crmTargets.generatedAt, available: crmTargets.available, summary: crmTargets.summary },
        queuedPreview: candidates.slice(0, 20).map((row) => ({
          influencer: normalizeText(row.fields['红人名称'], 120),
          platform: row.platform,
          homeUrl: readLinkCell(row.fields['红人链接'])
        }))
      });
    }

    if (approvalCandidates.length && !verifyTikTokApproval(tiktokApprovalId, approvalCandidates, finalApifyToken)) {
      return res.status(403).json({ ok: false, blockedReason: 'TIKTOK_APPROVAL_REQUIRED', error: 'TikTok 付费抓取必须先免费审计，并使用30分钟内、绑定当前候选清单的 Ryan 批准记录。' });
    }

    const videos = store.videos.map((row) => ({ ...row, fields: row.fields || row }));
    const snapshots = store.snapshots.map((row) => ({ ...row, fields: row.fields || row }));
    const runs = store.runs.map((row) => ({ ...row, fields: row.fields || row }));
    const localInfluencers = store.influencers.map((row) => ({ ...row, fields: { ...(row.fields || row) } }));

    const videoByKey = new Map();
    const registeredVideoCreatorPlatforms = new Set();
    for (const row of videos) {
      const fields = row.fields || {};
      const platform = normalizePlatform(readSelectText(fields['平台']));
      const creator = normalizeCreatorName(fields['红人名称']);
      if (creator && platform) registeredVideoCreatorPlatforms.add(`${creator}__${platform}`);
      const key = buildVideoDedupKey({ platform, postId: fields.id, postUrl: readLinkCell(fields.url) });
      if (key) videoByKey.set(key, row);
    }

    const latestSnapshotByPostKey = new Map();
    for (const row of snapshots) {
      const fields = row.fields || {};
      const postKey = String(fields.postKey || '').trim();
      if (!postKey) continue;
      const capturedAt = toNumber(fields.capturedAt, 0);
      const previous = latestSnapshotByPostKey.get(postKey);
      if (!previous || capturedAt >= previous.capturedAt) latestSnapshotByPostKey.set(postKey, { capturedAt, fields });
    }

    const filterDays = Math.max(1, Number(days) || 7);
    const safeMaxItems = Math.max(1, Number(maxItems) || 30);
    const filterWindowEnd = parseDateSafe(publishedBefore) || new Date();
    const actorDays = Math.max(filterDays + (publishedBefore ? 1 : 0), Number(actorLookbackDays) || 0);
    const workflowTag = `local_discovery_${Date.now()}`;
    const report = [];
    let totalUsageUsd = 0;
    let totalScraped = 0;
    let totalMatched = 0;
    let totalVideoCreated = 0;
    let totalVideoSkipped = 0;
    let totalSnapshotCreated = 0;
    let totalErrors = 0;
    let blockedReason = '';

    for (let idx = 0; idx < candidates.length; idx += 1) {
      const inf = candidates[idx];
      const platform = inf.platform;
      const fields = inf.fields || {};
      const influencerInput = readLinkCell(fields['红人链接']) || String(fields['红人名称'] || '').trim();
      const influencerName = normalizeText(String(fields['红人名称'] || inferInfluencerNameFromUrl(influencerInput)), 120) || `influencer_${idx + 1}`;
      const safeInfluencerName = influencerName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_');
      const productKeywords = String(fields['样品型号'] || '').trim() || globalKeywords;
      const keywordList = normalizeKeywords(productKeywords);
      const monitorText = parseMonitorEnabled(fields['是否监控']) ? '是' : '否';
      const { actorId, actorInput } = getDiscoveryActorRequest({ platform, influencerInput, maxItems: safeMaxItems, days: actorDays });
      const reservationId = `${runId}_${idx + 1}`;
      const reservation = await reserveActorBudget({ reservationId, batchActualUsd: totalUsageUsd, meta: { runId, platform, influencerInput } });
      if (!reservation.ok) {
        blockedReason = reservation.blockedReason;
        report.push({ platform, influencerInput, scraped: 0, matched: 0, videoCreated: 0, snapshotCreated: 0, usageUsd: 0, blockedReason });
        break;
      }

      try {
        const run = await runApifyActor({ apiToken: finalApifyToken, actorId, actorInput, maxItems: safeMaxItems });
        const usageUsd = Number(run.runData?.usageTotalUsd || 0);
        await settleActorBudget({ reservationId, actualUsd: usageUsd, meta: { runId, platform, influencerInput, actorRunId: run.runData?.id || '' } });
        totalUsageUsd += usageUsd;
        totalScraped += run.items.length;
        await writeWorkflowJson(path.join(RAW_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_raw.json`), {
          meta: { workflowTag, runId, index: idx + 1, platform, influencerInput, influencerName, actorId, actorInput, runData: run.runData, datasetId: run.datasetId },
          items: run.items
        });

        const cleanedRows = [];
        for (const item of run.items) {
          const { cleaned, keep } = cleanDiscoveryItem({ platform, item, keywords: keywordList, windowEnd: filterWindowEnd, days: filterDays });
          if (keep) cleanedRows.push(cleaned);
        }
        const matched = cleanedRows.filter((row) => row.isProductPost && row.postUrl);
        totalMatched += matched.length;
        await writeWorkflowJson(path.join(OUTPUT_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_cleaned.json`), {
          meta: { workflowTag, runId, index: idx + 1, platform, influencerInput, influencerName, actorId, days: filterDays, maxItems: safeMaxItems },
          rows: cleanedRows
        });

        const followerCount = Math.max(
          0,
          ...cleanedRows.map((row) => toNumber(row.creatorFollowersCount, 0)).filter((number) => Number.isFinite(number) && number > 0)
        );
        const existingUrls = [readLinkCell(fields.url), readLinkCell(fields.url2), readLinkCell(fields.url3)].filter(Boolean);
        const matchedUrls = [...new Set(matched.map((row) => row.postUrl).filter(Boolean))];
        const uniqueNewUrls = matchedUrls.filter((url) => !existingUrls.map(normalizePostUrl).includes(normalizePostUrl(url)));
        const localInfluencer = localInfluencers[inf.localIndex];
        const localFields = localInfluencer.fields || {};
        const filledSlots = [];
        for (const slot of ['url', 'url2', 'url3']) {
          if (!readLinkCell(localFields[slot]) && uniqueNewUrls.length) {
            const url = uniqueNewUrls.shift();
            localFields[slot] = makeLinkCell(url);
            filledSlots.push({ slot, url });
          }
        }
        const followerRowsUpdated = syncFollowerCountToLocalInfluencerRows(localInfluencers, {
          creatorName: localFields['红人名称'] || influencerName,
          platform,
          followerCount
        });
        if (platform && readSelectText(localFields['平台']) !== platform) localFields['平台'] = platform;

        let videoCreated = 0;
        let videoSkipped = 0;
        let snapshotCreated = 0;
        for (const row of matched) {
          const postId = normalizeText(row.postId || '', 100);
          const dedupKey = buildVideoDedupKey({ platform, postId, postUrl: row.postUrl });
          if (dedupKey && videoByKey.has(dedupKey)) {
            videoSkipped += 1;
            totalVideoSkipped += 1;
            continue;
          }

          const timestampDate = parseDateSafe(row.publishTime);
          const videoFields = {
            红人名称: normalizeText(row.creatorUsername || localFields['红人名称'] || influencerName, 200),
            平台: platform,
            是否监控: monitorText,
            id: postId,
            timestamp: timestampDate ? timestampDate.toISOString() : normalizeText(row.publishTime || '', 80),
            url: makeLinkCell(row.postUrl),
            caption: normalizeText(row.caption || '', 2000),
            commentsCount: toNumber(row.commentsCount, 0),
            likesCount: toNumber(row.likesCount, 0),
            videoViewCount: toNumber(row.videoViewCount, 0),
            videoPlayCount: toNumber(row.videoPlayCount, 0),
            videoUrl: normalizeText(row.videoUrl || '', 1000),
            displayUrl: normalizeText(row.coverImage || '', 1000)
          };
          const videoRecord = {
            id: makeLocalId('vid'),
            fields: videoFields,
            source: 'local-discovery',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          videos.push(videoRecord);
          if (dedupKey) videoByKey.set(dedupKey, videoRecord);
          const createdCreator = normalizeCreatorName(videoFields['红人名称']);
          if (createdCreator && platform) registeredVideoCreatorPlatforms.add(`${createdCreator}__${platform}`);
          videoCreated += 1;
          totalVideoCreated += 1;

          const postKey = postId ? `${platform}_${postId}` : `${platform}_${row.postUrl}`;
          const previous = latestSnapshotByPostKey.get(postKey)?.fields || {};
          const capturedAt = Date.now();
          const play = toNumber(videoFields.videoPlayCount, 0);
          const view = toNumber(videoFields.videoViewCount, 0);
          const like = toNumber(videoFields.likesCount, 0);
          const comment = toNumber(videoFields.commentsCount, 0);
          const share = toNumber(row.sharesCount, 0);
          const firstSeenAt = toNumber(previous.firstSeenAt, capturedAt);
          const snapshotFields = {
            runId,
            capturedAt,
            platform,
            红人名称: videoFields['红人名称'],
            postKey,
            postId,
            postUrl: row.postUrl,
            isProductPost: '是',
            是否监控: monitorText,
            isFirstSeen: previous.postKey ? '否' : '是',
            snapshotType: 'new',
            firstSeenAt,
            videoPlayCount: play,
            videoViewCount: view,
            likesCount: like,
            commentsCount: comment,
            sharesCount: share,
            playDelta: play - toNumber(previous.videoPlayCount, 0),
            viewDelta: view - toNumber(previous.videoViewCount, 0),
            likeDelta: like - toNumber(previous.likesCount, 0),
            commentDelta: comment - toNumber(previous.commentsCount, 0),
            shareDelta: share - toNumber(previous.sharesCount, 0)
          };
          snapshots.push({
            id: makeLocalId('snap'),
            fields: snapshotFields,
            source: 'local-discovery',
            createdAt: new Date().toISOString()
          });
          latestSnapshotByPostKey.set(postKey, { capturedAt, fields: snapshotFields });
          snapshotCreated += 1;
          totalSnapshotCreated += 1;
        }

        const creatorKey = normalizeCreatorName(localFields['红人名称']);
        const hasRegisteredVideo =
          matched.length > 0 ||
          existingUrls.length > 0 ||
          Boolean(creatorKey && platform && registeredVideoCreatorPlatforms.has(`${creatorKey}__${platform}`));
        localFields['是否出视频'] = hasRegisteredVideo ? '是' : '否';

        const rowReport = {
          platform,
          actorId,
          influencerInput,
          scraped: run.items.length,
          matched: matched.length,
          matchedUrls,
          filledSlots,
          followerCount,
          followerRowsUpdated,
          videoCreated,
          videoSkipped,
          snapshotCreated,
          usageUsd: Number(usageUsd.toFixed(6))
        };
        report.push(rowReport);
        await writeWorkflowJson(path.join(OUTPUT_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_summary.json`), rowReport);
      } catch (error) {
        const uncertainStart = /network failed|status request network failed/i.test(String(error?.message || error));
        if (!uncertainStart) await releaseActorBudget(reservationId);
        totalErrors += 1;
        const errorReport = {
          platform,
          actorId,
          influencerInput,
          scraped: 0,
          matched: 0,
          matchedUrls: [],
          filledSlots: [],
          followerCount: 0,
          videoCreated: 0,
          videoSkipped: 0,
          snapshotCreated: 0,
          usageUsd: 0,
          budgetReservationState: uncertainStart ? 'uncertain_kept' : 'released',
          error: sanitizeErrorMessage(error)
        };
        report.push(errorReport);
        await writeWorkflowJson(path.join(OUTPUT_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_summary.json`), errorReport);
      }
    }

    const status = totalErrors ? (totalErrors === report.length ? 'failed' : 'partial') : 'success';
    const runFields = {
      createdAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      task: '本地新视频发现',
      status,
      message: `处理 ${report.length} 位，新增视频 ${totalVideoCreated} 条，跳过重复 ${totalVideoSkipped} 条，错误 ${totalErrors} 个。`,
      days: filterDays,
      maxItems: safeMaxItems,
      limitInfluencers: limit,
      skipInfluencers: offset,
      platformFilter: normalizedPlatformFilter,
      includeUnmonitoredTargets: Boolean(includeUnmonitoredTargets),
      usageUsd: Number(totalUsageUsd.toFixed(6)),
      scraped: totalScraped,
      matched: totalMatched,
      videoCreated: totalVideoCreated,
      videoSkipped: totalVideoSkipped,
      snapshotCreated: totalSnapshotCreated,
      errors: totalErrors
    };
    runFields.blockedReason = blockedReason;
    runs.unshift({ id: runId, fields: runFields, source: 'local-discovery' });
    await Promise.all([
      writeJsonArray(LOCAL_DATA_FILES.influencers, localInfluencers),
      writeJsonArray(LOCAL_DATA_FILES.videos, videos),
      writeJsonArray(LOCAL_DATA_FILES.snapshots, snapshots),
      writeJsonArray(LOCAL_DATA_FILES.runs, runs.slice(0, 500))
    ]);

    const finalLedger = await loadBudgetLedger();
    return res.json({
      ok: true,
      message: '本地抓取完成，数据已写入本地中台，未调用钉钉 API。',
      runId,
      status,
      window: { days: filterDays, publishedBefore: filterWindowEnd.toISOString() },
      processedInfluencers: report.length,
      skippedInfluencers: offset,
      summary: runFields,
      usageBudget: budgetStatus({ ledger: finalLedger, batchActualUsd: totalUsageUsd }),
      blockedReason,
      report
    });
  } catch (error) {
    const runs = await readJsonArray(LOCAL_DATA_FILES.runs);
    runs.unshift({
      id: runId,
      fields: {
        createdAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        task: '本地新视频发现',
        status: 'failed',
        message: sanitizeErrorMessage(error)
      },
      source: 'local-discovery'
    });
    await writeJsonArray(LOCAL_DATA_FILES.runs, runs.slice(0, 500));
    return res.status(500).json({ ok: false, error: sanitizeErrorMessage(error) || '本地抓取失败。' });
  } finally {
    if (acquiredLock) localDiscoveryRunning = false;
  }
});

app.post('/api/workflow/refresh-dingtalk-milestones', async (req, res) => {
  let acquiredRefreshLock = false;
  try {
    const {
      appKey = process.env.DINGTALK_APP_KEY,
      appSecret = process.env.DINGTALK_APP_SECRET,
      baseId = process.env.DINGTALK_DOC_ID,
      videoTableId = process.env.DINGTALK_VIDEO_TABLE_ID,
      snapshotTableId = process.env.DINGTALK_SNAPSHOT_TABLE_ID,
      operatorId = process.env.DINGTALK_OPERATOR_ID,
      dryRun = false
    } = req.body || {};

    if (!appKey || !appSecret || !baseId || !videoTableId || !snapshotTableId || !operatorId) {
      return res.status(400).json({ ok: false, error: '钉钉里程碑配置不完整。' });
    }
    if (!dryRun && !process.env.APIFY_API_TOKEN) {
      return res.status(400).json({ ok: false, error: 'Apify Token 不能为空。' });
    }
    if (!dryRun) {
      if (dingTalkMilestoneRefreshRunning) {
        return res.status(409).json({ ok: false, error: '已有视频里程碑刷新任务正在运行，请稍后再试。' });
      }
      dingTalkMilestoneRefreshRunning = true;
      acquiredRefreshLock = true;
    }

    const accessToken = await dingTalkGetAccessToken({ appKey: String(appKey).trim(), appSecret: String(appSecret).trim() });
    const resolvedOperatorId = await dingTalkResolveOperatorUnionId({
      accessToken,
      operatorId: String(operatorId).trim()
    });
    const [videoFields, snapshotFields, videoRecords, snapshotRecords] = await Promise.all([
      dingTalkListFields({ accessToken, baseId: String(baseId).trim(), sheetId: String(videoTableId).trim(), operatorId: resolvedOperatorId }),
      dingTalkListFields({ accessToken, baseId: String(baseId).trim(), sheetId: String(snapshotTableId).trim(), operatorId: resolvedOperatorId }),
      dingTalkListRecords({ accessToken, baseId: String(baseId).trim(), sheetId: String(videoTableId).trim(), operatorId: resolvedOperatorId }),
      dingTalkListRecords({ accessToken, baseId: String(baseId).trim(), sheetId: String(snapshotTableId).trim(), operatorId: resolvedOperatorId })
    ]);
    const videoFieldTypeMap = new Map(videoFields.map((field) => [field.name, field.type]));
    const snapshotFieldTypeMap = new Map(snapshotFields.map((field) => [field.name, field.type]));
    const snapshotTypesByPostKey = new Map();
    const latestSnapshotByPostKey = new Map();
    for (const record of snapshotRecords) {
      const fields = record.fields || {};
      const postKey = String(fields.postKey || '').trim();
      if (!postKey) continue;
      const snapshotType = String(fields.snapshotType || '').trim();
      if (!snapshotTypesByPostKey.has(postKey)) snapshotTypesByPostKey.set(postKey, new Set());
      if (snapshotType) snapshotTypesByPostKey.get(postKey).add(snapshotType);
      const capturedAt = toNumber(fields.capturedAt, 0);
      const latest = latestSnapshotByPostKey.get(postKey);
      if (!latest || capturedAt >= latest.capturedAt) latestSnapshotByPostKey.set(postKey, { capturedAt, fields });
    }

    const now = new Date();
    const due = [];
    for (const record of videoRecords) {
      const fields = record.fields || {};
      if (!parseMonitorEnabled(fields['是否监控'])) continue;
      const platform = normalizePlatform(readSelectText(fields['平台']));
      const postUrl = readLinkCell(fields.url);
      const postId = normalizeText(fields.id || '', 100);
      const publishedAt = parseDateSafe(fields.timestamp);
      if (!['instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok'].includes(platform) || !postUrl || !publishedAt) continue;
      const postKey = postId ? `${platform}_${postId}` : `${platform}_${postUrl}`;
      const types = snapshotTypesByPostKey.get(postKey) || new Set();
      const ageDays = (now.getTime() - publishedAt.getTime()) / (24 * 60 * 60 * 1000);
      let milestone = '';
      if (ageDays >= 30 && !types.has('milestone_30d')) milestone = 'milestone_30d';
      else if (ageDays >= 7 && ageDays < 30 && !types.has('milestone_7d')) milestone = 'milestone_7d';
      if (milestone) due.push({ recordId: record.id, fields, platform, postUrl, postId, postKey, publishedAt, ageDays, milestone });
    }

    if (dryRun || due.length === 0) {
      const ledger = await loadBudgetLedger();
      return res.json({
        ok: true,
        dryRun: Boolean(dryRun),
        message: due.length ? '里程碑检查完成，未调用 Apify。' : '当前没有到期视频，未调用 Apify。',
        due: due.map((item) => ({
          platform: item.platform,
          postUrl: item.postUrl,
          publishedAt: item.publishedAt.toISOString(),
          ageDays: Number(item.ageDays.toFixed(1)),
          milestone: item.milestone
        })),
        usageEstimate: estimateApifyUsageForCandidates(due),
        usageBudget: budgetStatus({ ledger }),
        blockedReason: ''
      });
    }

    const finalApifyToken = process.env.APIFY_API_TOKEN;
    const runId = `milestone_${Date.now()}`;
    const report = [];
    const grouped = new Map();
    const payableDue = due.filter((item) => item.platform !== 'tiktok');
    const tiktokBlocked = due.length - payableDue.length;
    for (const item of payableDue) {
      if (!grouped.has(item.platform)) grouped.set(item.platform, []);
      grouped.get(item.platform).push(item);
    }

    let batchActualUsd = 0;
    let blockedReason = tiktokBlocked ? 'TIKTOK_APPROVAL_REQUIRED' : '';
    let groupIndex = 0;
    for (const [platform, platformDue] of grouped) {
      groupIndex += 1;
      const { actorId, actorInput } = buildMilestoneActorRequest(platform, platformDue.map((item) => item.postUrl));
      const reservationId = `${runId}_${groupIndex}`;
      const reservation = await reserveActorBudget({ reservationId, batchActualUsd, meta: { runId, platform, source: 'milestone' } });
      if (!reservation.ok) {
        blockedReason = reservation.blockedReason;
        report.push(...platformDue.map((item) => ({ platform, postUrl: item.postUrl, milestone: item.milestone, status: 'blocked', blockedReason })));
        break;
      }
      let run;
      try {
        run = await runApifyActor({ apiToken: finalApifyToken, actorId, actorInput, maxItems: platformDue.length });
        const usageUsd = Number(run.runData?.usageTotalUsd || 0);
        batchActualUsd += usageUsd;
        await settleActorBudget({ reservationId, actualUsd: usageUsd, meta: { runId, platform, actorRunId: run.runData?.id || '', source: 'milestone' } });
      } catch (error) {
        const uncertainStart = /network failed|status request network failed/i.test(String(error?.message || error));
        if (!uncertainStart) await releaseActorBudget(reservationId);
        report.push(...platformDue.map((item) => ({ platform, postUrl: item.postUrl, milestone: item.milestone, status: 'error', error: sanitizeErrorMessage(error), budgetReservationState: uncertainStart ? 'uncertain_kept' : 'released' })));
        continue;
      }
      await fs.writeFile(
        path.join(RAW_DIR, `${runId}_${platform}_direct_refresh_raw.json`),
        JSON.stringify({ meta: { actorId, actorInput, runData: run.runData, datasetId: run.datasetId }, items: run.items }, null, 2),
        'utf8'
      );

      for (const item of platformDue) {
        const found = findMilestoneItem(platform, run.items, item.postUrl);
        if (!found) {
          report.push({ platform, postUrl: item.postUrl, milestone: item.milestone, status: 'not_found' });
          continue;
        }
        const row = found.cleaned;
        const videoFieldsInput = {
          红人名称: normalizeText(row.creatorUsername || item.fields['红人名称'] || '', 200),
          平台: platform,
          是否监控: readSelectText(item.fields['是否监控']) || '是',
          id: normalizeText(row.postId || item.postId || '', 100),
          timestamp: item.fields.timestamp,
          url: item.postUrl,
          caption: normalizeText(row.caption || item.fields.caption || '', 2000),
          commentsCount: toNumber(row.commentsCount, item.fields.commentsCount || 0),
          likesCount: toNumber(row.likesCount, item.fields.likesCount || 0),
          videoViewCount: toNumber(row.videoViewCount, item.fields.videoViewCount || 0),
          videoPlayCount: toNumber(row.videoPlayCount, item.fields.videoPlayCount || 0),
          videoUrl: normalizeText(row.videoUrl || item.fields.videoUrl || '', 1000),
          displayUrl: normalizeText(row.coverImage || item.fields.displayUrl || '', 1000)
        };
        await dingTalkUpdateRecord({
          accessToken,
          baseId: String(baseId).trim(),
          sheetId: String(videoTableId).trim(),
          operatorId: resolvedOperatorId,
          recordId: item.recordId,
          fields: normalizeDingTalkFieldsBySchema(videoFieldsInput, videoFieldTypeMap)
        });

        const previous = latestSnapshotByPostKey.get(item.postKey)?.fields || {};
        const capturedAt = Date.now();
        const play = toNumber(videoFieldsInput.videoPlayCount, 0);
        const view = toNumber(videoFieldsInput.videoViewCount, 0);
        const like = toNumber(videoFieldsInput.likesCount, 0);
        const comment = toNumber(videoFieldsInput.commentsCount, 0);
        const share = toNumber(row.sharesCount, 0);
        const snapshotInput = {
          runId,
          capturedAt,
          platform,
          红人名称: videoFieldsInput['红人名称'],
          postKey: item.postKey,
          postId: videoFieldsInput.id,
          postUrl: item.postUrl,
          isProductPost: '是',
          是否监控: videoFieldsInput['是否监控'],
          isFirstSeen: '否',
          snapshotType: item.milestone,
          firstSeenAt: toNumber(previous.firstSeenAt, item.publishedAt.getTime()),
          videoPlayCount: play,
          videoViewCount: view,
          likesCount: like,
          commentsCount: comment,
          sharesCount: share,
          playDelta: play - toNumber(previous.videoPlayCount, 0),
          viewDelta: view - toNumber(previous.videoViewCount, 0),
          likeDelta: like - toNumber(previous.likesCount, 0),
          commentDelta: comment - toNumber(previous.commentsCount, 0),
          shareDelta: share - toNumber(previous.sharesCount, 0)
        };
        await dingTalkCreateRecords({
          accessToken,
          baseId: String(baseId).trim(),
          sheetId: String(snapshotTableId).trim(),
          operatorId: resolvedOperatorId,
          records: [{ fields: normalizeDingTalkFieldsBySchema(snapshotInput, snapshotFieldTypeMap) }]
        });
        report.push({ platform, postUrl: item.postUrl, milestone: item.milestone, status: 'updated' });
      }
    }

    const finalLedger = await loadBudgetLedger();
    return res.json({ ok: true, message: '已登记视频里程碑刷新完成。', refreshed: report.filter((item) => item.status === 'updated').length, report, usageBudget: budgetStatus({ ledger: finalLedger, batchActualUsd }), blockedReason, tiktokBlocked });
  } catch (error) {
    return res.status(500).json({ ok: false, error: sanitizeErrorMessage(error) || '服务内部错误。' });
  } finally {
    if (acquiredRefreshLock) dingTalkMilestoneRefreshRunning = false;
  }
});

app.post('/api/workflow/sync-dingtalk', async (req, res) => {
  let acquiredSyncLock = false;
  try {
    const {
      appKey = process.env.DINGTALK_APP_KEY,
      appSecret = process.env.DINGTALK_APP_SECRET,
      baseId = process.env.DINGTALK_DOC_ID,
      influencerTableId = process.env.DINGTALK_INFLUENCER_TABLE_ID,
      videoTableId = process.env.DINGTALK_VIDEO_TABLE_ID,
      snapshotTableId = process.env.DINGTALK_SNAPSHOT_TABLE_ID,
      operatorId = process.env.DINGTALK_OPERATOR_ID,
      detailActorId = 'xMc5Ga1oCONPmWJIa',
      days = 14,
      maxItems = 50,
      globalKeywords = 'yozma,yozmasport',
      limitInfluencers = 1,
      skipInfluencers = 0,
      onlyInfluencerInputs = [],
      platformFilter = 'all',
      publishedBefore = '',
      dryRun = false
    } = req.body || {};

    if (!appKey || !appSecret || !baseId || !influencerTableId || !videoTableId || !operatorId) {
      return res.status(400).json({ ok: false, error: '钉钉配置不完整。' });
    }
    if (!dryRun && !process.env.APIFY_API_TOKEN) {
      return res.status(400).json({ ok: false, error: 'Apify Token 不能为空。' });
    }
    if (!dryRun) {
      if (dingTalkSyncRunning) {
        return res.status(409).json({ ok: false, error: '已有钉钉新视频发现任务正在运行，请稍后再试。' });
      }
      dingTalkSyncRunning = true;
      acquiredSyncLock = true;
    }

    const runId = `run_${Date.now()}`;
    const finalApifyToken = process.env.APIFY_API_TOKEN;
    const dingtalkAuth = { appKey: String(appKey).trim(), appSecret: String(appSecret).trim() };
    let accessToken = await dingTalkGetAccessToken(dingtalkAuth);
    const refreshDingTalkTokenIfNeeded = async () => {
      if (dingTalkAccessTokenCache.expiresAt - Date.now() < 10 * 60 * 1000) {
        accessToken = await dingTalkGetAccessToken(dingtalkAuth);
      }
      return accessToken;
    };
    const resolvedOperatorId = await dingTalkResolveOperatorUnionId({
      accessToken,
      operatorId: String(operatorId).trim()
    });

    const [influencerFields, videoFields, influencerRecords, videoRecords, snapshotFields, snapshotRecords] = await Promise.all([
      dingTalkListFields({ accessToken, baseId: String(baseId).trim(), sheetId: String(influencerTableId).trim(), operatorId: resolvedOperatorId }),
      dingTalkListFields({ accessToken, baseId: String(baseId).trim(), sheetId: String(videoTableId).trim(), operatorId: resolvedOperatorId }),
      dingTalkListRecords({ accessToken, baseId: String(baseId).trim(), sheetId: String(influencerTableId).trim(), operatorId: resolvedOperatorId }),
      dingTalkListRecords({ accessToken, baseId: String(baseId).trim(), sheetId: String(videoTableId).trim(), operatorId: resolvedOperatorId }),
      snapshotTableId
        ? dingTalkListFields({ accessToken, baseId: String(baseId).trim(), sheetId: String(snapshotTableId).trim(), operatorId: resolvedOperatorId })
        : Promise.resolve([]),
      snapshotTableId
        ? dingTalkListRecords({ accessToken, baseId: String(baseId).trim(), sheetId: String(snapshotTableId).trim(), operatorId: resolvedOperatorId })
        : Promise.resolve([])
    ]);

    const influencerFieldTypeMap = new Map(influencerFields.map((f) => [f.name, f.type]));
    const videoFieldTypeMap = new Map(videoFields.map((f) => [f.name, f.type]));
    const snapshotFieldTypeMap = new Map(snapshotFields.map((f) => [f.name, f.type]));
    const supportedInfluencerPlatforms = ['instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok'];
    const crmTargets = await loadCrmMonitorTargets();
    const normalizedPlatformFilter = normalizePlatform(platformFilter) || 'all';
    const influencerRows = influencerRecords.map((r) => {
      const fields = r.fields || {};
      return {
        recordId: r.id,
        fields,
        platform: resolveInfluencerPlatform(readSelectText(fields.平台), readLinkCell(fields['红人链接']))
      };
    });
    const countByPlatform = (rows) =>
      rows.reduce((counts, row) => {
        const key = row.platform || '未填写';
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {});
    const monitoredInfluencerRows = influencerRows.filter((r) => parseMonitorEnabled((r.fields || {})['是否监控']));
    const identifiedInfluencerRows = monitoredInfluencerRows.filter(
      (r) => r.fields['红人名称'] || readLinkCell(r.fields['红人链接'])
    );
    const eligibleInfluencerRows = identifiedInfluencerRows.filter((r) => supportedInfluencerPlatforms.includes(r.platform));
    const activeInfluencerRows = eligibleInfluencerRows.filter((r) => isCrmMonitorTarget(r, crmTargets));
    const selectedInfluencerRows = activeInfluencerRows.filter((r) =>
      normalizedPlatformFilter === 'all' ? true : r.platform === normalizedPlatformFilter
    );
    const candidateAudit = {
      totalRows: influencerRows.length,
      monitoredRows: monitoredInfluencerRows.length,
      eligibleRows: activeInfluencerRows.length,
      selectedRows: selectedInfluencerRows.length,
      disabledRows: influencerRows.length - monitoredInfluencerRows.length,
      missingIdentityRows: monitoredInfluencerRows.length - identifiedInfluencerRows.length,
      unsupportedRows: identifiedInfluencerRows.length - eligibleInfluencerRows.length,
      byPlatform: countByPlatform(activeInfluencerRows),
      unsupportedByPlatform: countByPlatform(
        identifiedInfluencerRows.filter((r) => !supportedInfluencerPlatforms.includes(r.platform))
      )
    };

    const videoByKey = new Map();
    const registeredVideoCreatorPlatforms = new Set();
    for (const r of videoRecords) {
      const fields = r.fields || {};
      const creator = normalizeCreatorName(fields['红人名称']);
      const platform = normalizePlatform(readSelectText(fields['平台']));
      if (creator && platform) registeredVideoCreatorPlatforms.add(`${creator}__${platform}`);
      const key = buildVideoDedupKey({
        platform,
        postId: fields.id,
        postUrl: readLinkCell(fields.url)
      });
      if (key) videoByKey.set(key, r);
    }

    const latestSnapshotByPostKey = new Map();
    for (const r of snapshotRecords) {
      const fields = r.fields || {};
      const postKey = String(fields.postKey || '').trim();
      if (!postKey) continue;
      const ts = toNumber(fields.capturedAt, 0);
      const prev = latestSnapshotByPostKey.get(postKey);
      if (!prev || ts >= prev.ts) latestSnapshotByPostKey.set(postKey, { ts, fields });
    }

    const candidateOffset = Math.max(0, Number(skipInfluencers) || 0);
    const onlyInputSet = new Set(
      (Array.isArray(onlyInfluencerInputs) ? onlyInfluencerInputs : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .flatMap((value) => [value, normalizePostUrl(value)])
    );
    const targetedInfluencerRows = onlyInputSet.size
      ? selectedInfluencerRows.filter((row) => {
          const input = readLinkCell(row.fields['红人链接']) || String(row.fields['红人名称'] || '').trim();
          return onlyInputSet.has(String(input || '').trim()) || onlyInputSet.has(normalizePostUrl(input));
        })
      : selectedInfluencerRows;
    const requestedCandidates = targetedInfluencerRows
      .slice(candidateOffset, candidateOffset + Math.max(1, Number(limitInfluencers) || 1));
    const candidates = dryRun ? requestedCandidates : requestedCandidates.filter((row) => row.platform !== 'tiktok');

    if (dryRun) {
      const ledger = await loadBudgetLedger();
      return res.json({
        ok: true,
        message: '钉钉权限检查通过，未调用 Apify，未写入数据。',
        dryRun: true,
        candidateAudit: { ...candidateAudit, targetedRows: targetedInfluencerRows.length, queuedRows: requestedCandidates.length, contractCompletedStoppedRows: 0, manuallyStoppedRows: Number(crmTargets.summary.manuallyStopped || crmTargets.stoppedRows || 0), tiktokApprovalRequired: requestedCandidates.filter((row) => row.platform === 'tiktok').length },
        usageEstimate: estimateApifyUsageForCandidates(requestedCandidates),
        usageBudget: budgetStatus({ ledger }),
        blockedReason: '',
        queuedPreview: requestedCandidates.slice(0, 20).map((row) => ({ influencer: normalizeText(row.fields['红人名称'], 120), platform: row.platform, homeUrl: readLinkCell(row.fields['红人链接']) })),
        targetSource: { path: CRM_MONITOR_TARGETS_PATH, generatedAt: crmTargets.generatedAt, available: crmTargets.available, summary: crmTargets.summary },
        tables: {
          influencer: { id: String(influencerTableId).trim(), fields: influencerFields.length, records: influencerRecords.length },
          video: { id: String(videoTableId).trim(), fields: videoFields.length, records: videoRecords.length },
          snapshot: { id: String(snapshotTableId || '').trim(), fields: snapshotFields.length, records: snapshotRecords.length }
        }
      });
    }
    if (normalizedPlatformFilter === 'tiktok') {
      return res.status(403).json({ ok: false, blockedReason: 'TIKTOK_APPROVAL_REQUIRED', error: '定时/钉钉同步不得自动运行 TikTok；请在本地中台先免费审计并由 Ryan 批准。' });
    }

    const report = [];
    const filterDays = Math.max(1, Number(days) || 14);
    const filterWindowEnd = parseDateSafe(publishedBefore) || new Date();
    const actorDays = filterDays + (publishedBefore ? 1 : 0);

    const workflowTag = `sync_dingtalk_${Date.now()}`;
    let batchActualUsd = 0;
    let blockedReason = requestedCandidates.some((row) => row.platform === 'tiktok') ? 'TIKTOK_SKIPPED_FOR_APPROVAL' : '';
    for (let idx = 0; idx < candidates.length; idx += 1) {
      const inf = candidates[idx];
      const platform = String(inf.platform || '').trim();
      const influencerInput = readLinkCell(inf.fields['红人链接']) || String(inf.fields['红人名称'] || '').trim();
      const influencerName = normalizeText(String(inf.fields['红人名称'] || ''), 120) || `influencer_${idx + 1}`;
      const safeInfluencerName = influencerName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_');
      const perKeywords = String(inf.fields['样品型号'] || '').trim();
      const productKeywords = perKeywords || globalKeywords;
      const monitorText = parseMonitorEnabled((inf.fields || {})['是否监控']) ? '是' : '否';

      const fixedActorId =
        platform === 'youtubevideo'
          ? 'h7sDV53CddomktSi5'
          : platform === 'youtubeshort'
            ? 'WT1BVWatl2aHVeFEH'
            : platform === 'tiktok'
              ? 'GdWCkxBtKWOsKjdch'
              : 'xMc5Ga1oCONPmWJIa';

      const actorInput =
        platform === 'youtubevideo'
          ? buildYouTubeVideoActorInput({ influencerInput, maxItems: Number(maxItems) || 27, days: actorDays })
          : platform === 'youtubeshort'
            ? buildYouTubeShortActorInput({ influencerInput, maxItems: Number(maxItems) || 27, days: actorDays })
            : platform === 'tiktok'
              ? buildTikTokActorInput({ influencerInput, maxItems: Number(maxItems) || 30, days: actorDays })
              : buildActorInput({ platform: 'instagram', influencerInput, maxItems: Number(maxItems) || 27, days: actorDays, actorId: fixedActorId });
      const reservationId = `${runId}_${idx + 1}`;
      const reservation = await reserveActorBudget({ reservationId, batchActualUsd, meta: { runId, platform, influencerInput, source: 'sync-dingtalk' } });
      if (!reservation.ok) {
        blockedReason = reservation.blockedReason;
        report.push({ platform, influencerInput, blockedReason, scraped: 0, matched: 0, videoCreated: 0, snapshotCreated: 0, usageUsd: 0 });
        break;
      }

      try {
      const run = await runApifyActor({ apiToken: finalApifyToken, actorId: fixedActorId, actorInput, maxItems: Number(maxItems) || 30 });
      const usageUsd = Number(run.runData?.usageTotalUsd || 0);
      batchActualUsd += usageUsd;
      await settleActorBudget({ reservationId, actualUsd: usageUsd, meta: { runId, platform, influencerInput, actorRunId: run.runData?.id || '', source: 'sync-dingtalk' } });
      await fs.writeFile(
        path.join(RAW_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_raw.json`),
        JSON.stringify(
          {
            meta: {
              workflowTag,
              index: idx + 1,
              platform,
              influencerInput,
              influencerName,
              actorId: fixedActorId,
              actorInput,
              runData: run.runData,
              datasetId: run.datasetId
            },
            items: run.items
          },
          null,
          2
        ),
        'utf-8'
      );

      const keywordList = normalizeKeywords(productKeywords);
      const cleanedRows = [];
      for (const item of run.items) {
        const { cleaned, keep } =
          ['youtubevideo', 'youtubeshort'].includes(platform)
            ? cleanYouTubeItem(item, keywordList, filterWindowEnd, filterDays, platform)
            : platform === 'tiktok'
              ? cleanTikTokItem(item, keywordList, filterWindowEnd, filterDays)
              : cleanItem(item, 'instagram', keywordList, filterWindowEnd, filterDays);
        if (keep) cleanedRows.push(cleaned);
      }
      await fs.writeFile(
        path.join(OUTPUT_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_cleaned.json`),
        JSON.stringify(
          {
            meta: {
              workflowTag,
              index: idx + 1,
              platform,
              influencerInput,
              influencerName,
              actorId: fixedActorId,
              days: filterDays,
              publishedBefore: filterWindowEnd.toISOString(),
              maxItems: Number(maxItems) || 50
            },
            rows: cleanedRows
          },
          null,
          2
        ),
        'utf-8'
      );

      const matched = cleanedRows.filter((r) => r.isProductPost && r.postUrl);
      const followerCount = Math.max(
        0,
        ...cleanedRows.map((r) => toNumber(r.creatorFollowersCount, 0)).filter((n) => Number.isFinite(n) && n > 0)
      );

      const existingUrls = [readLinkCell(inf.fields.url), readLinkCell(inf.fields.url2), readLinkCell(inf.fields.url3)].filter(Boolean);
      const matchedUrls = matched.map((m) => m.postUrl).filter(Boolean);
      const uniqueNew = [...new Set(matchedUrls)].filter((u) => !existingUrls.includes(u));
      const currentCreatorKey = normalizeCreatorName(inf.fields['红人名称']);
      const hasRegisteredVideo =
        matched.length > 0 ||
        existingUrls.length > 0 ||
        Boolean(currentCreatorKey && registeredVideoCreatorPlatforms.has(`${currentCreatorKey}__${platform}`));

      const updateFields = {};
      const slots = ['url', 'url2', 'url3'];
      const filledSlots = [];
      for (const slot of slots) {
        if (!readLinkCell(inf.fields[slot]) && uniqueNew.length) {
          const newUrl = uniqueNew.shift();
          updateFields[slot] = { text: newUrl, link: newUrl };
          filledSlots.push({ slot, url: newUrl });
        }
      }
      const publishedStatusFields = buildPublishedVideoStatusFields(hasRegisteredVideo ? '是' : '否', influencerFieldTypeMap);
      for (const [fieldName, value] of Object.entries(publishedStatusFields)) {
        const currentValue = readSelectText(inf.fields[fieldName]) || String(inf.fields[fieldName] || '').trim();
        if (currentValue !== value) updateFields[fieldName] = value;
      }
      if (followerCount > 0 && toNumber(inf.fields['红人粉丝数据'], 0) !== followerCount) {
        updateFields['红人粉丝数据'] = followerCount;
      }
      const safeInfluencerUpdateFields = normalizeDingTalkFieldsBySchema(updateFields, influencerFieldTypeMap);
      if (Object.keys(safeInfluencerUpdateFields).length) {
        await refreshDingTalkTokenIfNeeded();
        await dingTalkUpdateRecord({
          accessToken,
          baseId: String(baseId).trim(),
          sheetId: String(influencerTableId).trim(),
          operatorId: resolvedOperatorId,
          recordId: inf.recordId,
          fields: safeInfluencerUpdateFields
        });
      }

      let videoCreated = 0;
      let videoUpdated = 0;
      let videoSkipped = 0;
      let snapshotCreated = 0;

      for (const row of matched) {
        let detail = {};
        if (['instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok'].includes(platform)) {
          detail = row;
        } else {
          const detailInput = buildDetailActorInput({ targets: [row.postUrl], maxItems: 1 });
          const detailRun = await runApifyActor({ apiToken: finalApifyToken, actorId: detailActorId, actorInput: detailInput });
          detail = detailRun.items[0] || {};
        }

        const timestampRaw = detail.timestamp || row.publishTime || '';
        const timestampDate = parseDateSafe(timestampRaw);
        const timestampFieldType = videoFieldTypeMap.get('timestamp');
        const timestampValue =
          timestampFieldType === 'date'
            ? (timestampDate ? timestampDate.getTime() : null)
            : normalizeText(timestampRaw, 80);

        const videoFieldsInput = {
          红人名称: normalizeText(row.creatorUsername || String(inf.fields['红人名称'] || ''), 200),
          平台: platform,
          是否监控: monitorText,
          id: normalizeText(detail.id || row.postId || '', 100),
          timestamp: timestampValue,
          url: row.postUrl,
          caption: normalizeText(detail.caption || row.caption || '', 2000),
          commentsCount: toNumber(detail.commentsCount, row.commentsCount || 0),
          likesCount: toNumber(detail.likesCount, row.likesCount || 0),
          videoViewCount: toNumber(detail.videoViewCount, row.videoViewCount || 0),
          videoPlayCount: toNumber(detail.videoPlayCount, row.videoPlayCount || 0),
          videoUrl: normalizeText(detail.videoUrl || row.videoUrl || '', 1000),
          displayUrl: normalizeText(detail.displayUrl || row.coverImage || '', 1000)
        };
        const safeVideoFields = normalizeDingTalkFieldsBySchema(videoFieldsInput, videoFieldTypeMap);
        const dedupKey = buildVideoDedupKey({
          platform,
          postId: detail.id || row.postId || '',
          postUrl: row.postUrl
        });
        const existed = dedupKey ? videoByKey.get(dedupKey) : null;
        if (!Object.keys(safeVideoFields).length) {
          videoSkipped += 1;
          continue;
        }
        if (existed) {
          // Discovery only registers new videos. Existing video metrics are
          // refreshed separately at the 7-day and 30-day milestones.
          videoSkipped += 1;
          continue;
        } else {
          await refreshDingTalkTokenIfNeeded();
          const created = await dingTalkCreateRecords({
            accessToken,
            baseId: String(baseId).trim(),
            sheetId: String(videoTableId).trim(),
            operatorId: resolvedOperatorId,
            records: [{ fields: safeVideoFields }]
          });
          if (dedupKey) videoByKey.set(dedupKey, { id: created[0]?.id || '', fields: safeVideoFields });
          const createdCreator = normalizeCreatorName(safeVideoFields['红人名称']);
          const createdPlatform = normalizePlatform(readSelectText(safeVideoFields['平台']));
          if (createdCreator && createdPlatform) registeredVideoCreatorPlatforms.add(`${createdCreator}__${createdPlatform}`);
          videoCreated += 1;
        }

        if (snapshotTableId) {
          const postId = normalizeText(detail.id || row.postId || '', 100);
          const postKey = postId ? `${platform}_${postId}` : `${platform}_${row.postUrl}`;
          const prev = latestSnapshotByPostKey.get(postKey)?.fields || {};
          const capturedAtMs = Date.now();
          const prevFirstSeenAt = toNumber(prev.firstSeenAt, 0);
          const isFirstSeen = !latestSnapshotByPostKey.has(postKey);
          const firstSeenAt = isFirstSeen ? capturedAtMs : prevFirstSeenAt || capturedAtMs;
          const play = toNumber(videoFieldsInput.videoPlayCount, 0);
          const view = toNumber(videoFieldsInput.videoViewCount, 0);
          const like = toNumber(videoFieldsInput.likesCount, 0);
          const comment = toNumber(videoFieldsInput.commentsCount, 0);
          const share = toNumber(detail.sharesCount, row.sharesCount || 0);
          const snapshotInput = {
            runId,
            capturedAt: capturedAtMs,
            platform,
            红人名称: normalizeText(row.creatorUsername || String(inf.fields['红人名称'] || ''), 200),
            postKey,
            postId,
            postUrl: row.postUrl,
            isProductPost: row.isProductPost ? '是' : '否',
            是否监控: monitorText,
            isFirstSeen: isFirstSeen ? '是' : '否',
            snapshotType: 'new',
            firstSeenAt,
            videoPlayCount: play,
            videoViewCount: view,
            likesCount: like,
            commentsCount: comment,
            sharesCount: share,
            playDelta: play - toNumber(prev.videoPlayCount, 0),
            viewDelta: view - toNumber(prev.videoViewCount, 0),
            likeDelta: like - toNumber(prev.likesCount, 0),
            commentDelta: comment - toNumber(prev.commentsCount, 0),
            shareDelta: share - toNumber(prev.sharesCount, 0)
          };
          const safeSnapshotFields = normalizeDingTalkFieldsBySchema(snapshotInput, snapshotFieldTypeMap);
          await refreshDingTalkTokenIfNeeded();
          await dingTalkCreateRecords({
            accessToken,
            baseId: String(baseId).trim(),
            sheetId: String(snapshotTableId).trim(),
            operatorId: resolvedOperatorId,
            records: [{ fields: safeSnapshotFields }]
          });
          latestSnapshotByPostKey.set(postKey, { ts: toNumber(snapshotInput.capturedAt, 0), fields: snapshotInput });
          snapshotCreated += 1;
        }
      }

      report.push({
        platform,
        actorId: fixedActorId,
        influencerInput,
        scraped: run.items.length,
        matched: matched.length,
        matchedUrls,
        existingUrls,
        toFillUrls: [...new Set(matchedUrls)].filter((u) => !existingUrls.includes(u)),
        filledSlots,
        followerCount,
        videoCreated,
        videoUpdated,
        videoSkipped,
        snapshotCreated
        ,usageUsd: Number(usageUsd.toFixed(6))
      });
      await fs.writeFile(
        path.join(OUTPUT_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_summary.json`),
        JSON.stringify(report[report.length - 1], null, 2),
        'utf-8'
      );
      } catch (error) {
        const uncertainStart = /network failed|status request network failed/i.test(String(error?.message || error));
        if (!uncertainStart) await releaseActorBudget(reservationId);
        const errorReport = {
          platform,
          actorId: fixedActorId,
          influencerInput,
          scraped: 0,
          matched: 0,
          matchedUrls: [],
          existingUrls: [],
          toFillUrls: [],
          filledSlots: [],
          followerCount: 0,
          videoCreated: 0,
          videoUpdated: 0,
          videoSkipped: 0,
          snapshotCreated: 0,
          budgetReservationState: uncertainStart ? 'uncertain_kept' : 'released',
          error: sanitizeErrorMessage(error)
        };
        report.push(errorReport);
        await fs.writeFile(
          path.join(OUTPUT_DIR, `${workflowTag}_${idx + 1}_${platform}_${safeInfluencerName}_summary.json`),
          JSON.stringify(errorReport, null, 2),
          'utf-8'
        );
      }
    }

    const finalLedger = await loadBudgetLedger();
    return res.json({
      ok: true,
      message: '钉钉同步完成。',
      window: {
        days: filterDays,
        publishedBefore: filterWindowEnd.toISOString()
      },
      processedInfluencers: report.length,
      skippedInfluencers: candidateOffset,
      usageBudget: budgetStatus({ ledger: finalLedger, batchActualUsd }),
      blockedReason,
      report
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: sanitizeErrorMessage(error) || '服务内部错误。' });
  } finally {
    if (acquiredSyncLock) dingTalkSyncRunning = false;
  }
});

app.post('/api/workflow/sync-feishu', async (req, res) => {
  try {
    const {
      appId = process.env.FEISHU_APP_ID,
      appSecret = process.env.FEISHU_APP_SECRET,
      appToken = process.env.FEISHU_APP_TOKEN,
      influencerTableId = process.env.FEISHU_INFLUENCER_TABLE_ID,
      videoTableId = process.env.FEISHU_VIDEO_TABLE_ID,
      apiToken,
      scrapeActorId = 'xMc5Ga1oCONPmWJIa',
      detailActorId = 'xMc5Ga1oCONPmWJIa',
      days = 14,
      maxItems = 50,
      globalKeywords = 'yozma,yozmasport',
      limitInfluencers = 1,
      platformFilter = 'all'
    } = req.body || {};

    if (!appId || !appSecret || !appToken || !influencerTableId || !videoTableId) {
      return res.status(400).json({ ok: false, error: '飞书配置不完整。' });
    }
    if (!apiToken && !process.env.APIFY_API_TOKEN) {
      return res.status(400).json({ ok: false, error: 'Apify Token 不能为空。' });
    }

    const finalApifyToken = apiToken || process.env.APIFY_API_TOKEN;
    const tenantToken = await feishuGetTenantToken({ appId, appSecret });
    const influencerRecords = await feishuListRecords({
      tenantToken,
      appToken,
      tableId: influencerTableId
    });
    const videoRecords = await feishuListRecords({
      tenantToken,
      appToken,
      tableId: videoTableId
    });

    const videoByUrl = new Map();
    for (const r of videoRecords) {
      const url = readLinkCell(r.fields?.url);
      if (url) videoByUrl.set(url, r);
    }
    const influencerFieldNames = new Set(
      (await feishuListFields({ tenantToken, appToken, tableId: influencerTableId })).map((f) => f.field_name)
    );
    const videoFieldNames = new Set(
      (await feishuListFields({ tenantToken, appToken, tableId: videoTableId })).map((f) => f.field_name)
    );

    const normalizedPlatformFilter = normalizePlatform(platformFilter) || 'all';
    const candidates = influencerRecords
      .map((r) => ({
        recordId: r.record_id,
        fields: r.fields || {},
        platform: normalizePlatform(readSelectText((r.fields || {})['平台']))
      }))
      .filter((r) => ['instagramreels', 'youtubevideo', 'youtubeshort', 'tiktok'].includes(r.platform))
      .filter((r) => (normalizedPlatformFilter === 'all' ? true : r.platform === normalizedPlatformFilter))
      .filter((r) => parseMonitorEnabled((r.fields || {})['是否监控']))
      .filter((r) => r.fields['红人名称'] || readLinkCell(r.fields['红人链接']))
      .slice(0, Math.max(1, Number(limitInfluencers) || 1));

    const report = [];

    for (const inf of candidates) {
      const platform = String(inf.platform || '').trim();
      const influencerInput = readLinkCell(inf.fields['红人链接']) || String(inf.fields['红人名称'] || '').trim();
      const perKeywords = String(inf.fields['样品型号'] || '').trim();
      const productKeywords = perKeywords || globalKeywords;
      const monitorEnabled = parseMonitorEnabled((inf.fields || {})['是否监控']);
      const monitorText = monitorEnabled ? '是' : '否';

      const fixedActorId =
        platform === 'youtubevideo'
          ? 'h7sDV53CddomktSi5'
          : platform === 'youtubeshort'
            ? 'WT1BVWatl2aHVeFEH'
            : platform === 'tiktok'
              ? 'GdWCkxBtKWOsKjdch'
            : 'xMc5Ga1oCONPmWJIa';
      const actorInput =
        platform === 'youtubevideo'
          ? buildYouTubeVideoActorInput({
              influencerInput,
              maxItems: Number(maxItems) || 27,
              days: Number(days) || 14
            })
          : platform === 'youtubeshort'
            ? buildYouTubeShortActorInput({
                influencerInput,
                maxItems: Number(maxItems) || 27,
                days: Number(days) || 14
              })
          : platform === 'tiktok'
            ? buildTikTokActorInput({
                influencerInput,
                maxItems: Number(maxItems) || 30,
                days: Number(days) || 14
              })
          : buildActorInput({
              platform: 'instagram',
              influencerInput,
              maxItems: Number(maxItems) || 27,
              days: Number(days) || 14,
              actorId: fixedActorId
            });
      let run;
      try {
        run = await runApifyActor({
          apiToken: finalApifyToken,
          actorId: fixedActorId,
          actorInput
        });
      } catch (e) {
        throw new Error(
          `platform=${platform}, actor=${fixedActorId}, actorInput=${JSON.stringify(actorInput)}; ${e.message || e}`
        );
      }

      const now = new Date();
      const keywordList = normalizeKeywords(productKeywords);
      const cleanedRows = [];
      for (const item of run.items) {
        const { cleaned, keep } =
          ['youtubevideo', 'youtubeshort'].includes(platform)
            ? cleanYouTubeItem(item, keywordList, now, Number(days) || 14, platform)
            : platform === 'tiktok'
              ? cleanTikTokItem(item, keywordList, now, Number(days) || 14)
            : cleanItem(item, 'instagram', keywordList, now, Number(days) || 14);
        if (keep) cleanedRows.push(cleaned);
      }
      const matched = cleanedRows.filter((r) => r.isProductPost && r.postUrl);
      const followerCandidates = cleanedRows
        .map((r) => toNumber(r.creatorFollowersCount, 0))
        .filter((n) => Number.isFinite(n) && n > 0);
      const followerCount = followerCandidates.length ? Math.max(...followerCandidates) : 0;

      const existingUrls = [readLinkCell(inf.fields.url), readLinkCell(inf.fields.url2), readLinkCell(inf.fields.url3)].filter(Boolean);
      const matchedUrls = matched.map((m) => m.postUrl).filter(Boolean);
      const uniqueNew = [...new Set(matchedUrls)].filter((u) => !existingUrls.includes(u));

      const updateFields = {};
      const slots = ['url', 'url2', 'url3'];
      const filledSlots = [];
      for (const slot of slots) {
        if (!readLinkCell(inf.fields[slot]) && uniqueNew.length) {
          const newUrl = uniqueNew.shift();
          updateFields[slot] = { text: newUrl, link: newUrl };
          filledSlots.push({ slot, url: newUrl });
        }
      }
      updateFields['是否出视频'] = matched.length > 0 ? '是' : '否';
      if (followerCount > 0) {
        updateFields['红人粉丝数据'] = String(followerCount);
      }
      const safeInfluencerUpdateFields = filterFieldsBySchema(updateFields, influencerFieldNames);
      if (Object.keys(safeInfluencerUpdateFields).length) {
        await feishuUpdateRecord({
          tenantToken,
          appToken,
          tableId: influencerTableId,
          recordId: inf.recordId,
          fields: safeInfluencerUpdateFields
        });
      }

      let videoCreated = 0;
      let videoUpdated = 0;
      let videoSkipped = 0;

      for (const row of matched) {
        let detail = {};
        if (['youtubevideo', 'youtubeshort', 'tiktok'].includes(platform)) {
          detail = row;
        } else {
          const detailInput = buildDetailActorInput({ targets: [row.postUrl], maxItems: 1 });
          const detailRun = await runApifyActor({
            apiToken: finalApifyToken,
            actorId: detailActorId,
            actorInput: detailInput
          });
          detail = detailRun.items[0] || {};
        }
        const fields = {
          红人名称: normalizeText(row.creatorUsername || String(inf.fields['红人名称'] || ''), 200),
          平台: platform,
          是否监控: monitorText,
          id: normalizeText(detail.id || row.postId || '', 100),
          timestamp: normalizeText(detail.timestamp || row.publishTime || '', 80),
          url: normalizeText(row.postUrl, 1000),
          caption: normalizeText(detail.caption || row.caption || '', 2000),
          commentsCount: normalizeText(toNumber(detail.commentsCount, row.commentsCount || 0), 50),
          likesCount: normalizeText(toNumber(detail.likesCount, row.likesCount || 0), 50),
          videoViewCount: normalizeText(toNumber(detail.videoViewCount, row.videoViewCount || 0), 50),
          videoPlayCount: normalizeText(toNumber(detail.videoPlayCount, row.videoPlayCount || 0), 50),
          videoUrl: normalizeText(detail.videoUrl || row.videoUrl || '', 1000)
        };
        const safeVideoFields = filterFieldsBySchema(fields, videoFieldNames);
        const existed = videoByUrl.get(row.postUrl);
        if (!Object.keys(safeVideoFields).length) {
          videoSkipped += 1;
          continue;
        }
        if (existed) {
          await feishuUpdateRecord({
            tenantToken,
            appToken,
            tableId: videoTableId,
            recordId: existed.record_id,
            fields: safeVideoFields
          });
          videoUpdated += 1;
        } else {
          const created = await feishuCreateRecordWithProbe({
            tenantToken,
            appToken,
            tableId: videoTableId,
            fields: safeVideoFields
          });
          videoByUrl.set(row.postUrl, { record_id: created.record?.record_id || '', fields });
          videoCreated += 1;
        }
      }

      report.push({
        platform,
        actorId: fixedActorId,
        influencerInput,
        scraped: run.items.length,
        matched: matched.length,
        matchedUrls,
        existingUrls,
        toFillUrls: [...new Set(matchedUrls)].filter((u) => !existingUrls.includes(u)),
        filledSlots,
        followerCount,
        videoCreated,
        videoUpdated,
        videoSkipped
      });
    }

    return res.json({
      ok: true,
      message: '飞书同步完成。',
      processedInfluencers: report.length,
      report
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || '服务内部错误。' });
  }
});

app.listen(PORT, HOST, async () => {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
