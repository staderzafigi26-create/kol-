const centerEls = {
  updatedAt: document.getElementById('centerUpdatedAt'),
  status: document.getElementById('centerStatus'),
  localInfluencers: document.getElementById('localInfluencers'),
  localVideos: document.getElementById('localVideos'),
  localSnapshots: document.getElementById('localSnapshots'),
  localViews: document.getElementById('localViews'),
  weekVideos: document.getElementById('centerWeekVideos'),
  weekCreators: document.getElementById('centerWeekCreators'),
  weekViews: document.getElementById('centerWeekViews'),
  weekDelta: document.getElementById('centerWeekDelta'),
  monthVideos: document.getElementById('centerMonthVideos'),
  monthCreators: document.getElementById('centerMonthCreators'),
  monthViews: document.getElementById('centerMonthViews'),
  monthDelta: document.getElementById('centerMonthDelta'),
  totalVideos: document.getElementById('centerTotalVideos'),
  totalCreators: document.getElementById('centerTotalCreators'),
  totalViews: document.getElementById('centerTotalViews'),
  totalDelta: document.getElementById('centerTotalDelta'),
  customVideos: document.getElementById('centerCustomVideos'),
  customCreators: document.getElementById('centerCustomCreators'),
  customViews: document.getElementById('centerCustomViews'),
  customDelta: document.getElementById('centerCustomDelta'),
  customRangeLabel: document.getElementById('centerCustomRangeLabel'),
  dateStart: document.getElementById('centerDateStart'),
  dateEnd: document.getElementById('centerDateEnd'),
  btnApplyCustomRange: document.getElementById('btnApplyCustomRange'),
  platformFilter: document.getElementById('centerPlatformFilter'),
  regionFilter: document.getElementById('centerRegionFilter'),
  ownerFilter: document.getElementById('centerOwnerFilter'),
  filterSummary: document.getElementById('dashboardFilterSummary'),
  voiceMetricControl: document.getElementById('voiceMetricControl'),
  weeklyTrendCoverage: document.getElementById('weeklyTrendCoverage'),
  periodInsightStrip: document.getElementById('periodInsightStrip'),
  btnResetDashboardFilters: document.getElementById('btnResetDashboardFilters'),
  btnResetMapFilter: document.getElementById('btnResetMapFilter'),
  kpiAvgViews: document.getElementById('kpiAvgViews'),
  kpiTopRegion: document.getElementById('kpiTopRegion'),
  kpiTopPlatform: document.getElementById('kpiTopPlatform'),
  kpiNeedFollowup: document.getElementById('kpiNeedFollowup'),
  opsHealthScore: document.getElementById('opsHealthScore'),
  opsTicker: document.getElementById('opsTicker'),
  opsSummaryChips: document.getElementById('opsSummaryChips'),
  opsActionList: document.getElementById('opsActionList'),
  focusBrief: document.getElementById('dashboardFocusBrief'),
  deliverableKpis: document.getElementById('deliverableKpis'),
  deliverableOwnerGrid: document.getElementById('deliverableOwnerGrid'),
  deliverableGapList: document.getElementById('deliverableGapList'),
  tierGrid: document.getElementById('centerTierGrid'),
  tierPeriodLabel: document.getElementById('tierPeriodLabel'),
  tierBenchmarkGrid: document.getElementById('tierBenchmarkGrid'),
  tierLeaderboardGrid: document.getElementById('tierLeaderboardGrid'),
  followupPoolGrid: document.getElementById('followupPoolGrid'),
  lifecycleGrid: document.getElementById('lifecycleGrid'),
  qualityGrid: document.getElementById('qualityGrid'),
  globalMapCanvas: document.getElementById('globalMapCanvas'),
  globalMapDetail: document.getElementById('globalMapDetail'),
  globalRegionBars: document.getElementById('globalRegionBars'),
  globalMapScopeLabel: document.getElementById('globalMapScopeLabel'),
  dataHealthGrid: document.getElementById('dataHealthGrid'),
  anniversarySnapshot: document.getElementById('anniversarySnapshot'),
  targetingSnapshot: document.getElementById('targetingSnapshot'),
  weeklyTrendChart: document.getElementById('weeklyTrendChart'),
  monthlyBarChart: document.getElementById('monthlyBarChart'),
  platformMatrix: document.getElementById('platformMatrix'),
  regionMissingNotice: document.getElementById('regionMissingNotice'),
  regionSummaryGrid: document.getElementById('regionSummaryGrid'),
  regionLeaderboardGrid: document.getElementById('regionLeaderboardGrid'),
  ownerMissingNotice: document.getElementById('ownerMissingNotice'),
  ownerSummaryGrid: document.getElementById('ownerSummaryGrid'),
  ownerVideoGrid: document.getElementById('ownerVideoGrid'),
  btnExportScopedVideos: document.getElementById('btnExportScopedVideos'),
  affiliateSalesNotice: document.getElementById('affiliateSalesNotice'),
  affiliateSalesKpis: document.getElementById('affiliateSalesKpis'),
  affiliateSalesCorrelation: document.getElementById('affiliateSalesCorrelation'),
  affiliateSalesRows: document.getElementById('affiliateSalesRows'),
  creatorLeaderboard: document.getElementById('creatorLeaderboard'),
  videoLeaderboard: document.getElementById('videoLeaderboard'),
  influencerRows: document.getElementById('localInfluencerRows'),
  videoRows: document.getElementById('localVideoRows'),
  videoTableSearch: document.getElementById('videoTableSearch'),
  videoFilterStart: document.getElementById('videoFilterStart'),
  videoFilterEnd: document.getElementById('videoFilterEnd'),
  videoFilterPlatform: document.getElementById('videoFilterPlatform'),
  videoFilterOwner: document.getElementById('videoFilterOwner'),
  btnResetVideoFilters: document.getElementById('btnResetVideoFilters'),
  videoEditModal: document.getElementById('videoEditModal'),
  videoEditCreator: document.getElementById('videoEditCreator'),
  videoEditOwner: document.getElementById('videoEditOwner'),
  videoEditRegion: document.getElementById('videoEditRegion'),
  videoEditPlatform: document.getElementById('videoEditPlatform'),
  videoEditTimestamp: document.getElementById('videoEditTimestamp'),
  videoEditViews: document.getElementById('videoEditViews'),
  videoEditLikes: document.getElementById('videoEditLikes'),
  videoEditComments: document.getElementById('videoEditComments'),
  videoEditUrl: document.getElementById('videoEditUrl'),
  videoEditCaption: document.getElementById('videoEditCaption'),
  videoEditHint: document.getElementById('videoEditHint'),
  btnCloseVideoEditor: document.getElementById('btnCloseVideoEditor'),
  btnSaveVideoEditor: document.getElementById('btnSaveVideoEditor'),
  snapshotRows: document.getElementById('localSnapshotRows'),
  runRows: document.getElementById('localRunRows'),
  importText: document.getElementById('importInfluencerText'),
  importVideoText: document.getElementById('importVideoText'),
  importVideoFile: document.getElementById('importVideoFile'),
  localDiscoverDays: document.getElementById('localDiscoverDays'),
  localDiscoverMaxItems: document.getElementById('localDiscoverMaxItems'),
  localDiscoverLimit: document.getElementById('localDiscoverLimit'),
  localDiscoverSkip: document.getElementById('localDiscoverSkip'),
  localDiscoverPlatform: document.getElementById('localDiscoverPlatform'),
  localDiscoverKeywords: document.getElementById('localDiscoverKeywords'),
  confirmApifyRun: document.getElementById('confirmApifyRun'),
  apifyEstimateBox: document.getElementById('apifyEstimateBox'),
  btnRefresh: document.getElementById('btnRefreshCenter'),
  btnPrint: document.getElementById('btnPrintCenter'),
  btnImportInfluencers: document.getElementById('btnImportInfluencers'),
  btnImportVideos: document.getElementById('btnImportVideos'),
  btnImportDingTalk: document.getElementById('btnImportDingTalk'),
  btnLocalDiscoverDryRun: document.getElementById('btnLocalDiscoverDryRun'),
  btnLocalDiscoverRun: document.getElementById('btnLocalDiscoverRun')
};

let centerStore = {};
let centerDashboard = {};
let centerAnniversary = null;
let centerTargeting = null;
let centerPeriod = 'week';
let dashboardVoiceMode = localStorage.getItem('yozma-dashboard-voice-mode') === 'mature' ? 'mature' : 'live';
let customRange = { start: null, end: null };
let selectedMapPlaceKey = '';
let mapDrillMode = 'world';
let dashboardFilters = { platform: 'all', region: 'all', owner: 'all', country: 'all' };
let worldMapChart = null;
let weeklyTrendEchart = null;
let platformCompareChart = null;
let worldGeoReady = null;
let usaGeoReady = null;
let canadaGeoReady = null;
let europeGeoReady = null;
let activeVideoEditId = '';
let lastDiscoverApprovalId = '';
let dashboardIndexCache = {
  followerByCreator: null,
  locationByCreator: null,
  regionByCreator: null,
  ownerByCreator: null,
  milestone7dByPostKey: null,
  milestoneTypesByPostKey: null,
  snapshotsByPostKey: null
};
let scopedVideoRowsCache = new Map();
let geoStatsCache = new Map();
let pendingMapSync = null;
const STATIC_ASSET_VERSION = '20260622-live-voice-1';
const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const isStaticCenter = !localHostnames.has(location.hostname) || new URLSearchParams(location.search).has('static');
const staticAssetFetchOptions = { cache: 'no-store' };

function assetUrl(path) {
  const cleaned = String(path || '').replace(/^\/+/, '');
  if (!isStaticCenter || !/^(static-data|data)\//.test(cleaned)) return cleaned;
  const separator = cleaned.includes('?') ? '&' : '?';
  return `${cleaned}${separator}v=${STATIC_ASSET_VERSION}`;
}

function apiUrl(path) {
  return isStaticCenter ? assetUrl(path) : path;
}

function configureStaticMode() {
  if (!isStaticCenter) return;
  document.body.classList.add('static-center');
  const headerEyebrow = document.querySelector('.command-header .eyebrow');
  if (headerEyebrow) headerEyebrow.textContent = 'YOZMA TEAM READ-ONLY DASHBOARD';
  const returnLink = document.querySelector('.hero-actions a[href="/"]');
  if (returnLink) {
    returnLink.href = 'index.html';
    returnLink.textContent = '返回首页';
  }
  const staticExportLinks = [
    ['/api/local/export/influencers?format=csv', 'static-data/exports/influencers.csv'],
    ['/api/local/export/videos?format=csv', 'static-data/exports/videos.csv'],
    ['/api/local/export/snapshots?format=csv', 'static-data/exports/snapshots.csv'],
    ['/api/local/export/runs?format=csv', 'static-data/exports/runs.csv'],
    ['/api/local/export/affiliateSales?format=csv', 'static-data/exports/affiliateSales.csv'],
    ['/api/local/export/influencers?format=json', 'static-data/exports/influencers.json'],
    ['/api/local/export/videos?format=json', 'static-data/exports/videos.json'],
    ['/api/local/export/affiliateSales?format=json', 'static-data/exports/affiliateSales.json'],
    ['/api/local/templates/video-import.xlsx', 'data/templates/video-import-template.xlsx'],
    ['/api/local/templates/video-import.csv', 'data/templates/dingtalk-csv/视频表.csv']
  ];
  for (const [from, to] of staticExportLinks) {
    document.querySelectorAll(`a[href="${from}"]`).forEach((link) => {
      link.href = assetUrl(to);
    });
  }
  [centerEls.btnImportDingTalk, centerEls.btnImportInfluencers, centerEls.btnImportVideos, centerEls.btnLocalDiscoverDryRun, centerEls.btnLocalDiscoverRun].forEach((button) => {
    if (!button) return;
    button.disabled = true;
    button.title = '团队只读版不支持导入、写入或抓取。';
  });
}

let compactTopbarActive = false;

function syncCompactTopbar() {
  const nextActive = compactTopbarActive ? window.scrollY > 44 : window.scrollY > 104;
  if (nextActive === compactTopbarActive) return;
  compactTopbarActive = nextActive;
  document.body.classList.toggle('compact-topbar', compactTopbarActive);
}

function readStickyPx(name, fallback) {
  const styles = getComputedStyle(document.body);
  const value = Number.parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function getStickyScrollOffset() {
  const top = readStickyPx('--sticky-header-top', 0);
  const gap = readStickyPx('--sticky-gap', 8);
  const header = readStickyPx('--sticky-header-height', 64);
  const assets = readStickyPx('--sticky-asset-height', 56);
  const nav = readStickyPx('--sticky-nav-height', 44);
  const dashboard = readStickyPx('--sticky-dashboard-height', 84);
  return top + header + gap + assets + gap + nav + gap + dashboard + 40;
}

function scrollToCenterTarget(target, behavior = 'smooth') {
  syncCompactTopbar();
  const top = target.getBoundingClientRect().top + window.scrollY - getStickyScrollOffset();
  window.scrollTo({ top: Math.max(0, top), behavior });
}

function alignHashTargetAfterRender() {
  const hash = decodeURIComponent(location.hash || '').replace(/^#/, '');
  if (!hash) return;
  const target = document.getElementById(hash);
  if (!target) return;
  window.requestAnimationFrame(() => scrollToCenterTarget(target, 'auto'));
}

function invalidateDashboardCaches() {
  dashboardIndexCache = {
    followerByCreator: null,
    locationByCreator: null,
    regionByCreator: null,
    ownerByCreator: null,
    milestone7dByPostKey: null,
    milestoneTypesByPostKey: null,
    snapshotsByPostKey: null
  };
  scopedVideoRowsCache = new Map();
  geoStatsCache = new Map();
}

function currentFilterKey() {
  return [
    centerPeriod,
    customRange.start || '',
    customRange.end || '',
    dashboardFilters.platform,
    dashboardFilters.region,
    dashboardFilters.owner,
    dashboardFilters.country,
    dashboardVoiceMode
  ].join('|');
}

function getDashboardHelpers() {
  return {
    regionByCreator: getRegionByCreator(),
    ownerByCreator: getOwnerByCreator(),
    locationByCreator: getLocationByCreator(),
    followerByCreator: getFollowerByCreator()
  };
}

function scheduleMapDependentRender() {
  if (pendingMapSync) window.cancelAnimationFrame(pendingMapSync);
  pendingMapSync = window.requestAnimationFrame(() => {
    pendingMapSync = null;
    updateDashboardControlState();
    renderCommandKpis();
    renderDataHealth();
    renderRegionPerformance();
    renderOwnerPerformance();
    renderLeaderboards();
    renderTables();
  });
}

function centerNumber(value) {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function shortText(value, max = 16) {
  const text = String(value || '').trim();
  return text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
}

function rawNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const timestamp = value < 10000000000 ? value * 1000 : value;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{10,}$/.test(text)) {
    const timestamp = Number(text);
    const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function centerDate(value) {
  const date = parseDateValue(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function fullDate(value) {
  const date = parseDateValue(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour12: false }).format(date);
}

function dateInputValue(value) {
  const date = parseDateValue(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateTimeInputValue(value) {
  const date = parseDateValue(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function dateOnlyLabel(value) {
  const date = parseDateValue(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date);
}

function startOfInputDay(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function exclusiveEndOfInputDay(value) {
  const date = startOfInputDay(value);
  if (!date) return null;
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

function readLocalLink(cell) {
  if (!cell) return '';
  if (typeof cell === 'string') return cell;
  return cell.link || cell.text || '';
}

function readLocalText(cell) {
  if (!cell) return '';
  if (typeof cell === 'string' || typeof cell === 'number') return String(cell);
  return cell.text || cell.name || cell.value || cell.link || '';
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
      cells.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value.trim());
  return cells;
}

function parseVideoImportRows(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const firstCells = parseCsvLine(lines[0]);
  const hasHeader = firstCells.some((cell) => /视频链接|url|link/i.test(cell));
  const headers = hasHeader ? firstCells : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines
    .map((line) => {
      const cells = parseCsvLine(line);
      if (!headers.length) return { url: cells[0] };
      return headers.reduce((row, header, index) => {
        row[header] = cells[index] || '';
        return row;
      }, {});
    })
    .filter((row) => row.url || row['视频链接'] || row['视频链接（必填）'] || row.link);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('文件读取失败。'));
    reader.readAsText(file, 'utf-8');
  });
}

async function centerRequest(url, options = {}) {
  if (isStaticCenter) {
    if (String(url).startsWith('/api/local/collections')) {
      const response = await fetch(assetUrl('static-data/collections.json'), staticAssetFetchOptions);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `静态数据加载失败：HTTP ${response.status}`);
      return data;
    }
    if (String(url).startsWith('/api/local/dashboard')) {
      const response = await fetch(assetUrl('static-data/dashboard.json'), staticAssetFetchOptions);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `静态仪表盘加载失败：HTTP ${response.status}`);
      return data;
    }
    throw new Error('团队只读版不支持写入、导入或抓取操作。');
  }
  const response = await fetch(apiUrl(url), options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || `请求失败：HTTP ${response.status}`);
  return data;
}

async function loadCreatorLocations() {
  try {
    const response = await fetch(assetUrl('data/creator-locations.json'), staticAssetFetchOptions);
    if (!response.ok) return { locations: [] };
    return response.json();
  } catch (_error) {
    return { locations: [] };
  }
}

async function loadAnniversaryDashboard() {
  try {
    const response = await fetch(assetUrl('data/anniversary-dashboard.json'), staticAssetFetchOptions);
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return data?.ok ? data : null;
  } catch (_error) {
    return null;
  }
}

async function loadTargetingOpportunities() {
  try {
    const response = await fetch(assetUrl('data/targeting-opportunities.json'), staticAssetFetchOptions);
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return data?.ok && data.publicSafe ? data : null;
  } catch (_error) {
    return null;
  }
}

function clearRows(tbody) {
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
}

function labelCell(cell, label) {
  if (label) cell.dataset.label = label;
  return cell;
}

function addCell(row, text, label = '') {
  const cell = document.createElement('td');
  labelCell(cell, label);
  cell.textContent = text;
  row.appendChild(cell);
  return cell;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortDate(value, mode = 'week') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  if (mode === 'month') return `${date.getMonth() + 1}月`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function platformLabel(platform) {
  const key = String(platform || '').toLowerCase();
  if (key.includes('youtube') && key.includes('short')) return 'YouTube Shorts';
  if (key.includes('youtube')) return 'YouTube Video';
  if (key.includes('instagram')) return 'Instagram Reels';
  if (key.includes('tiktok')) return 'TikTok';
  return platform || 'Unknown';
}

function platformClass(platform) {
  return String(platform || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function shortPlatformName(platform) {
  const label = platformLabel(platform);
  if (label === 'YouTube Shorts') return 'YT Shorts';
  if (label === 'YouTube Video') return 'YT Video';
  if (label === 'Instagram Reels') return 'IG Reels';
  return label;
}

function safeExternalUrl(value) {
  const raw = readLocalLink(value) || readLocalText(value) || String(value || '');
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (_error) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : '';
  }
}

function externalLink(url, label, className = '') {
  const safeUrl = safeExternalUrl(url);
  const safeLabel = escapeHtml(label || safeUrl || '-');
  if (!safeUrl) return safeLabel;
  const cls = className ? ` class="${escapeHtml(className)}"` : '';
  return `<a${cls} href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
}

function videoViews(fields) {
  return Math.max(rawNumber(fields.videoPlayCount), rawNumber(fields.videoViewCount), rawNumber(fields.views));
}

function latestKnownVideoViews(fields) {
  const directViews = videoViews(fields);
  const snapshots = getSnapshotsByPostKey().get(videoPostKey(fields)) || [];
  const snapshotViews = snapshots.reduce(
    (max, snapshot) => Math.max(max, rawNumber(snapshot.videoPlayCount), rawNumber(snapshot.videoViewCount)),
    0
  );
  return Math.max(directViews, snapshotViews);
}

function videoUrl(fields) {
  return safeExternalUrl(readLocalLink(fields.url) || readLocalLink(fields['视频链接']) || fields.videoUrl || fields.url || '');
}

function normalizePlatformKey(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('youtube') && key.includes('short')) return 'youtubeshort';
  if (key.includes('youtube')) return 'youtubevideo';
  if (key.includes('instagram')) return 'instagramreels';
  if (key.includes('tiktok')) return 'tiktok';
  return key.replace(/\s+/g, '');
}

function normalizeLocalPostUrl(value) {
  const raw = readLocalLink(value) || readLocalText(value) || String(value || '');
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    url.hash = '';
    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      const videoId = url.searchParams.get('v') || '';
      url.search = videoId ? `?v=${videoId}` : '';
    } else {
      url.search = '';
    }
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}${url.search}`.toLowerCase();
  } catch (_error) {
    return trimmed.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/+$/, '').toLowerCase();
  }
}

function videoPostKey(fields) {
  const platform = normalizePlatformKey(readLocalText(fields['平台']) || fields.platform);
  const postId = readLocalText(fields.id || fields.postId).trim();
  const url = readLocalLink(fields.url) || readLocalText(fields.url);
  if (!platform) return '';
  return postId ? `${platform}_${postId}` : `${platform}_${url}`;
}

function getMilestone7dByPostKey() {
  if (dashboardIndexCache.milestone7dByPostKey) return dashboardIndexCache.milestone7dByPostKey;
  const map = new Map();
  for (const row of centerStore.snapshots || []) {
    const fields = row.fields || row;
    if (readLocalText(fields.snapshotType) !== 'milestone_7d') continue;
    const postKey = readLocalText(fields.postKey).trim();
    if (!postKey) continue;
    const capturedAt = rawNumber(fields.capturedAt);
    const previous = map.get(postKey);
    if (!previous || capturedAt >= previous.capturedAt) map.set(postKey, { capturedAt, fields });
  }
  dashboardIndexCache.milestone7dByPostKey = map;
  return map;
}

function getMilestoneTypesByPostKey() {
  if (dashboardIndexCache.milestoneTypesByPostKey) return dashboardIndexCache.milestoneTypesByPostKey;
  const map = new Map();
  for (const row of centerStore.snapshots || []) {
    const fields = row.fields || row;
    const type = readLocalText(fields.snapshotType).trim();
    const postKey = readLocalText(fields.postKey).trim();
    if (!type || !postKey) continue;
    if (!map.has(postKey)) map.set(postKey, new Set());
    map.get(postKey).add(type);
  }
  dashboardIndexCache.milestoneTypesByPostKey = map;
  return map;
}

function getSnapshotsByPostKey() {
  if (dashboardIndexCache.snapshotsByPostKey) return dashboardIndexCache.snapshotsByPostKey;
  const map = new Map();
  for (const row of centerStore.snapshots || []) {
    const fields = row.fields || row;
    const postKey = readLocalText(fields.postKey).trim();
    if (!postKey) continue;
    if (!map.has(postKey)) map.set(postKey, []);
    map.get(postKey).push(fields);
  }
  dashboardIndexCache.snapshotsByPostKey = map;
  return map;
}

function hasValidSnapshotAfterDays(postKey, publishedAt, minDays, maxDays = Infinity) {
  if (!postKey || !publishedAt) return false;
  const minTime = publishedAt.getTime() + minDays * 24 * 60 * 60 * 1000;
  const maxTime = Number.isFinite(maxDays) ? publishedAt.getTime() + maxDays * 24 * 60 * 60 * 1000 : Infinity;
  return (getSnapshotsByPostKey().get(postKey) || []).some((fields) => {
    const capturedAt = rawNumber(fields.capturedAt);
    const views = Math.max(rawNumber(fields.videoPlayCount), rawNumber(fields.videoViewCount));
    return views > 0 && capturedAt >= minTime && capturedAt < maxTime;
  });
}

function sevenDayVideoViews(fields) {
  const manualValue = rawNumber(fields.mature7dViews || fields['7日声量'] || fields['七日声量'] || fields['7日播放']);
  if (manualValue) return manualValue;
  const snapshot = getMilestone7dByPostKey().get(videoPostKey(fields))?.fields;
  if (!snapshot) return 0;
  return Math.max(rawNumber(snapshot.videoPlayCount), rawNumber(snapshot.videoViewCount));
}

function dashboardVoiceViews(fields) {
  return dashboardVoiceMode === 'mature' ? sevenDayVideoViews(fields) : latestKnownVideoViews(fields);
}

function dashboardVoiceLabel() {
  return dashboardVoiceMode === 'mature' ? '7日成熟声量' : '即时播放';
}

function dashboardAverageLabel() {
  return dashboardVoiceMode === 'mature' ? '7日均播' : '即时均播';
}

function syncVoiceMetricLabels() {
  document.querySelectorAll('[data-voice-label]').forEach((node) => {
    node.textContent = dashboardVoiceLabel();
  });
  document.querySelectorAll('#voiceMetricControl button').forEach((button) => {
    button.classList.toggle('active', button.dataset.voiceMode === dashboardVoiceMode);
  });
}

function getInfluencerTier(followers) {
  const count = rawNumber(followers);
  if (count >= 500000) return { key: 'head', label: '头部红人', range: '≥ 50 万粉丝' };
  if (count >= 100000) return { key: 'waist', label: '腰部红人', range: '10 万 - 49.9 万粉丝' };
  if (count >= 10000) return { key: 'tail', label: '尾部红人', range: '1 万 - 9.9 万粉丝' };
  if (count > 0) return { key: 'micro', label: '微型红人', range: '< 1 万粉丝' };
  return { key: 'unknown', label: '待补充粉丝', range: '缺少粉丝数' };
}

function tierOrder() {
  return [
    { key: 'head', label: '头部红人', range: '≥ 50 万粉丝' },
    { key: 'waist', label: '腰部红人', range: '10 万 - 49.9 万粉丝' },
    { key: 'tail', label: '尾部红人', range: '1 万 - 9.9 万粉丝' },
    { key: 'micro', label: '微型红人', range: '< 1 万粉丝' }
  ];
}

function creatorKey(value) {
  return String(value || '').trim().toLowerCase();
}

function creatorLooseKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
}

function handleFromProfileUrl(value) {
  const url = readLocalLink(value) || readLocalText(value);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtube.com')) return (parts.find((part) => part.startsWith('@')) || '').replace(/^@/, '');
    if (host.includes('tiktok.com')) return (parts.find((part) => part.startsWith('@')) || '').replace(/^@/, '');
    if (host.includes('instagram.com')) {
      const first = parts[0] || '';
      return ['p', 'reel', 'reels', 'tv'].includes(first.toLowerCase()) ? '' : first;
    }
  } catch {
    return '';
  }
  return '';
}

function editDistanceWithinOne(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!left || !right || Math.abs(left.length - right.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > 1) return false;
      if (left.length > right.length) i += 1;
      else if (right.length > left.length) j += 1;
      else {
        i += 1;
        j += 1;
      }
    }
  }
  return edits + (left.length - i) + (right.length - j) <= 1;
}

function getFollowerByCreator() {
  if (dashboardIndexCache.followerByCreator) return dashboardIndexCache.followerByCreator;
  const map = new Map();
  for (const row of centerStore.influencers || []) {
    const fields = row.fields || row;
    const creator = creatorKey(readLocalText(fields['红人名称']));
    if (!creator) continue;
    const followers = rawNumber(readLocalText(fields['红人粉丝数据']) || fields.followers);
    map.set(creator, Math.max(map.get(creator) || 0, followers));
  }
  dashboardIndexCache.followerByCreator = map;
  return map;
}

const REGION_LOCATION_FALLBACKS = {
  US: { placeKey: 'US', placeLabel: 'United States', country: 'US', lat: 39.5, lng: -98.35, precision: 'country' },
  CA: { placeKey: 'CA', placeLabel: 'Canada', country: 'CA', lat: 56.13, lng: -106.35, precision: 'country' },
  UK: { placeKey: 'UK', placeLabel: 'United Kingdom', country: 'UK', lat: 54.5, lng: -2.5, precision: 'country' },
  EU: { placeKey: 'EU', placeLabel: 'Europe', country: 'EU', lat: 50.1, lng: 9.2, precision: 'country' },
  AU: { placeKey: 'AU', placeLabel: 'Australia', country: 'AU', lat: -25.27, lng: 133.77, precision: 'country' },
  未标注地区: { placeKey: 'UNKNOWN', placeLabel: '未标注地区', country: 'UNKNOWN', lat: 16, lng: 15, precision: 'unknown' }
};

const COUNTRY_TO_MAP_NAME = {
  US: 'United States',
  USA: 'United States',
  'United States': 'United States',
  CA: 'Canada',
  Canada: 'Canada',
  UK: 'United Kingdom',
  GB: 'United Kingdom',
  'United Kingdom': 'United Kingdom',
  EU: 'Europe',
  Europe: 'Europe',
  AU: 'Australia',
  Australia: 'Australia',
  BR: 'Brazil',
  Brazil: 'Brazil',
  CH: 'Switzerland',
  Switzerland: 'Switzerland',
  NO: 'Norway',
  Norway: 'Norway',
  TR: 'Turkey',
  Turkey: 'Turkey',
  JP: 'Japan',
  Japan: 'Japan',
  KR: 'South Korea',
  'South Korea': 'South Korea',
  NZ: 'New Zealand',
  'New Zealand': 'New Zealand',
  IT: 'Italy',
  Italy: 'Italy',
  FR: 'France',
  France: 'France',
  DE: 'Germany',
  Germany: 'Germany',
  ES: 'Spain',
  Spain: 'Spain',
  NL: 'Netherlands',
  Netherlands: 'Netherlands',
  AT: 'Austria',
  Austria: 'Austria',
  PL: 'Poland',
  Poland: 'Poland',
  BE: 'Belgium',
  Belgium: 'Belgium',
  SE: 'Sweden',
  Sweden: 'Sweden',
  IE: 'Ireland',
  Ireland: 'Ireland',
  DK: 'Denmark',
  Denmark: 'Denmark',
  FI: 'Finland',
  Finland: 'Finland',
  PT: 'Portugal',
  Portugal: 'Portugal',
  HR: 'Croatia',
  Croatia: 'Croatia',
  EE: 'Estonia',
  Estonia: 'Estonia',
  BG: 'Bulgaria',
  Bulgaria: 'Bulgaria',
  RO: 'Romania',
  Romania: 'Romania',
  GR: 'Greece',
  Greece: 'Greece',
  CZ: 'Czech Republic',
  Czechia: 'Czech Republic',
  'Czech Republic': 'Czech Republic',
  HU: 'Hungary',
  Hungary: 'Hungary',
  SK: 'Slovakia',
  Slovakia: 'Slovakia',
  SI: 'Slovenia',
  Slovenia: 'Slovenia',
  LT: 'Lithuania',
  Lithuania: 'Lithuania',
  LV: 'Latvia',
  Latvia: 'Latvia',
  LU: 'Luxembourg',
  Luxembourg: 'Luxembourg',
  MT: 'Malta',
  Malta: 'Malta',
  CY: 'Cyprus',
  Cyprus: 'Cyprus',
  MX: 'Mexico'
};

const COUNTRY_TO_REGION = {
  US: 'US',
  USA: 'US',
  'United States': 'US',
  CA: 'CA',
  Canada: 'CA',
  UK: 'UK',
  GB: 'UK',
  'United Kingdom': 'UK',
  EU: 'EU',
  Europe: 'EU',
  AU: 'Other',
  Australia: 'Other',
  BR: 'Other',
  Brazil: 'Other',
  CH: 'EU',
  Switzerland: 'EU',
  NO: 'EU',
  Norway: 'EU',
  TR: 'EU',
  Turkey: 'EU',
  JP: 'Other',
  Japan: 'Other',
  KR: 'Other',
  'South Korea': 'Other',
  NZ: 'Other',
  'New Zealand': 'Other',
  IT: 'EU',
  Italy: 'EU',
  FR: 'EU',
  France: 'EU',
  DE: 'EU',
  Germany: 'EU',
  ES: 'EU',
  Spain: 'EU',
  NL: 'EU',
  Netherlands: 'EU',
  AT: 'EU',
  Austria: 'EU',
  PL: 'EU',
  Poland: 'EU',
  BE: 'EU',
  Belgium: 'EU',
  SE: 'EU',
  Sweden: 'EU',
  IE: 'EU',
  Ireland: 'EU',
  DK: 'EU',
  Denmark: 'EU',
  FI: 'EU',
  Finland: 'EU',
  PT: 'EU',
  Portugal: 'EU',
  HR: 'EU',
  Croatia: 'EU',
  EE: 'EU',
  Estonia: 'EU',
  BG: 'EU',
  Bulgaria: 'EU',
  RO: 'EU',
  Romania: 'EU',
  GR: 'EU',
  Greece: 'EU',
  CZ: 'EU',
  Czechia: 'EU',
  'Czech Republic': 'EU',
  HU: 'EU',
  Hungary: 'EU',
  SK: 'EU',
  Slovakia: 'EU',
  SI: 'EU',
  Slovenia: 'EU',
  LT: 'EU',
  Lithuania: 'EU',
  LV: 'EU',
  Latvia: 'EU',
  LU: 'EU',
  Luxembourg: 'EU',
  MT: 'EU',
  Malta: 'EU',
  CY: 'EU',
  Cyprus: 'EU',
  MX: 'Other'
};

const US_STATE_NAMES = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
};

const CA_PROVINCE_NAMES = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Québec',
  SK: 'Saskatchewan',
  YT: 'Yukon'
};

const CA_PROVINCE_ALIASES = {
  QUEBEC: 'Québec',
  'PRINCE EDWARD ISLAND': 'Prince Edward Island',
  PEI: 'Prince Edward Island',
  NEWFOUNDLAND: 'Newfoundland and Labrador',
  LABRADOR: 'Newfoundland and Labrador',
  'NEWFOUNDLAND AND LABRADOR': 'Newfoundland and Labrador',
  'NORTHWEST TERRITORIES': 'Northwest Territories',
  'BRITISH COLUMBIA': 'British Columbia'
};

const MAP_DRILL_CONFIG = {
  us: {
    countryName: 'United States',
    countryCode: 'US',
    mapName: 'usaYozma',
    scopeLabel: 'US 州级',
    unitLabel: 'US 州级',
    drillLabel: '进入美国州级分布',
    activeCopy: '美国州级下钻已启用；点击海洋空白区域可返回世界地图。',
    palette: ['#152033', '#542537', '#E63946'],
    zoom: 1.18
  },
  ca: {
    countryName: 'Canada',
    countryCode: 'CA',
    mapName: 'canadaYozma',
    scopeLabel: 'Canada 省级',
    unitLabel: 'CA 省级',
    drillLabel: '进入加拿大省级分布',
    activeCopy: '加拿大省级下钻已启用；当前没有省份字段的数据会进入“Canada 未分省”。',
    palette: ['#102637', '#16606A', '#33D6C5'],
    zoom: 1.04
  },
  eu: {
    countryName: 'Europe + UK',
    countryCode: 'EU',
    mapName: 'europeYozma',
    scopeLabel: '欧英国家级',
    unitLabel: '欧英国家级',
    drillLabel: '进入欧英国家级分布',
    activeCopy: '欧英国家级下钻已启用；点击海洋空白区域可返回世界地图。',
    palette: ['#111F34', '#255C8C', '#4DA3FF', '#FFB454'],
    zoom: 1.05
  }
};

const MAP_COUNTRY_TO_DRILL_MODE = {
  'United States': 'us',
  Canada: 'ca',
  Europe: 'eu',
  'United Kingdom': 'eu',
  Germany: 'eu',
  France: 'eu',
  Italy: 'eu',
  Spain: 'eu',
  Netherlands: 'eu',
  Sweden: 'eu',
  Belgium: 'eu',
  Poland: 'eu',
  Austria: 'eu'
};

const EU_GROUP_FILTER = 'EU_UK_GROUP';
const EUROPE_WORLD_FALLBACK_COUNTRIES = ['Germany', 'France', 'Italy', 'United Kingdom', 'Spain', 'Netherlands', 'Sweden', 'Poland'];
const EUROPE_MAP_COUNTRIES = new Set([
  'Europe',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Sweden',
  'Belgium',
  'Poland',
  'Austria',
  'Switzerland',
  'Norway',
  'Turkey',
  'Ireland',
  'Denmark',
  'Finland',
  'Portugal',
  'Croatia',
  'Estonia',
  'Bulgaria',
  'Romania',
  'Greece',
  'Czech Republic',
  'Hungary',
  'Slovakia',
  'Slovenia',
  'Lithuania',
  'Latvia',
  'Luxembourg',
  'Malta',
  'Cyprus'
]);
const WORLD_MAP_FEATURE_ALIASES = {
  'Czech Republic': 'Czech Rep.',
  'South Korea': 'Korea',
  'Bosnia and Herzegovina': 'Bosnia and Herz.'
};

const MAP_VIDEO_HEAT_STOPS = [
  { threshold: 0.82, color: '#8F0F22' },
  { threshold: 0.66, color: '#B4142B' },
  { threshold: 0.48, color: '#CF2438' },
  { threshold: 0.28, color: '#E64655' },
  { threshold: 0.12, color: '#F56F78' },
  { threshold: 0, color: '#FF9BA2' }
];

function isEuropeGroupRow(row = {}) {
  return row.region === 'EU'
    || row.region === 'UK'
    || row.country === 'EU'
    || row.country === 'UK'
    || EUROPE_MAP_COUNTRIES.has(row.mapCountry)
    || EUROPE_MAP_COUNTRIES.has(row.placeLabel);
}

function mapFilterLabel(value) {
  if (value === EU_GROUP_FILTER) return '欧盟 + 英国';
  return value;
}

function countryFilterForDrillMode(mode, fallbackCountry = 'all') {
  if (mode === 'eu') return EU_GROUP_FILTER;
  return fallbackCountry || MAP_DRILL_CONFIG[mode]?.countryName || 'all';
}

function resetMapToWorld() {
  dashboardFilters.country = 'all';
  mapDrillMode = 'world';
  selectedMapPlaceKey = '';
  renderPeriodSensitiveViews();
  renderTables();
}

function enterMapDrill(mode, fallbackCountry = '') {
  mapDrillMode = mode;
  dashboardFilters.country = countryFilterForDrillMode(mode, fallbackCountry);
  selectedMapPlaceKey = '';
  updateDashboardControlState();
  renderGlobalMap();
  scheduleMapDependentRender();
}

const MAP_REGION_THEMES = {
  US: { key: 'us', main: '#E63946', mid: '#8D2B3B', rgb: '230, 57, 70', border: 'rgba(230, 57, 70, 0.42)' },
  CA: { key: 'ca', main: '#33D6C5', mid: '#16606A', rgb: '51, 214, 197', border: 'rgba(51, 214, 197, 0.42)' },
  UK: { key: 'uk', main: '#FFB454', mid: '#705133', rgb: '255, 180, 84', border: 'rgba(255, 180, 84, 0.42)' },
  EU: { key: 'eu', main: '#4DA3FF', mid: '#255C8C', rgb: '77, 163, 255', border: 'rgba(77, 163, 255, 0.42)' },
  OTHER: { key: 'other', main: '#A8B3C7', mid: '#334155', rgb: '168, 179, 199', border: 'rgba(168, 179, 199, 0.28)' }
};

function geoPoint(lat, lng) {
  const x = Math.min(96, Math.max(4, ((Number(lng) + 180) / 360) * 100));
  const y = Math.min(92, Math.max(8, ((90 - Number(lat)) / 180) * 100));
  return { x, y };
}

function locationRows() {
  return Array.isArray(centerStore.creatorLocations?.locations) ? centerStore.creatorLocations.locations : [];
}

function getLocationByCreator() {
  if (dashboardIndexCache.locationByCreator) return dashboardIndexCache.locationByCreator;
  const map = new Map();
  for (const item of locationRows()) {
    const keys = [
      creatorKey(item.creator),
      item.creatorKey ? `loose:${creatorLooseKey(item.creatorKey)}` : '',
      item.codeKey || '',
      item.code ? item.code.toLowerCase() : ''
    ].filter(Boolean);
    for (const key of keys) {
      if (!map.has(key)) map.set(key, item);
    }
  }
  dashboardIndexCache.locationByCreator = map;
  return map;
}

function normalizeRegion(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (['us', 'usa', 'u.s.', 'u.s.a.', 'united states', 'america', '美国'].includes(lower)) return 'US';
  if (['ca', 'canada', '加拿大'].includes(lower)) return 'CA';
  if (['uk', 'u.k.', 'united kingdom', 'britain', 'england', '英国'].includes(lower)) return 'UK';
  if (['eu', 'europe', 'european union', '欧洲', '欧盟'].includes(lower)) return 'EU';
  if (['au', 'australia', '澳洲', '澳大利亚'].includes(lower)) return 'AU';
  return raw.toUpperCase() === raw && raw.length <= 4 ? raw : raw;
}

function regionFromInfluencerCode(value) {
  const code = String(value || '').trim();
  if (!code) return '';
  const match = code.match(/(?:^|[^A-Za-z])(US|USA|CA|UK|EU|AU)(?:[^A-Za-z]|$)/i) || code.match(/^(US|USA|CA|UK|EU|AU)[-_]/i);
  if (!match) return '';
  return normalizeRegion(match[1]);
}

function readRegionField(fields) {
  const codeRegion = regionFromInfluencerCode(readLocalText(fields['红人编码']) || readLocalText(fields['达人编码']) || readLocalText(fields['KOL编码']));
  if (codeRegion) return codeRegion;
  const candidates = [
    '地区',
    '国家/地区',
    '国家',
    '区域',
    '市场',
    '所属地区',
    'Region',
    'region',
    'Country',
    'country',
    'Country / Region',
    'Market',
    'market'
  ];
  for (const key of candidates) {
    const value = readLocalText(fields[key]);
    const region = normalizeRegion(value);
    if (region) return region;
  }
  return '';
}

function getRegionByCreator() {
  if (dashboardIndexCache.regionByCreator) return dashboardIndexCache.regionByCreator;
  const map = new Map();
  for (const row of centerStore.influencers || []) {
    const fields = row.fields || row;
    const platform = normalizePlatformKey(readLocalText(fields['平台']) || fields.platform);
    const creator = creatorKey(readLocalText(fields['红人名称']));
    const looseCreator = creatorLooseKey(readLocalText(fields['红人名称']));
    const handle = handleFromProfileUrl(fields['红人链接']);
    if (!creator && !looseCreator && !handle) continue;
    const region = readRegionField(fields);
    if (!region) continue;
    const keys = [
      creator,
      creator && platform ? `${creator}__${platform}` : '',
      looseCreator ? `loose:${looseCreator}` : '',
      looseCreator && platform ? `loose:${looseCreator}__${platform}` : '',
      handle ? creatorKey(handle) : '',
      handle && platform ? `${creatorKey(handle)}__${platform}` : '',
      handle ? `loose:${creatorLooseKey(handle)}` : ''
    ].filter(Boolean);
    for (const key of keys) {
      if (!map.has(key) || map.get(key) === '未标注地区') map.set(key, region);
    }
  }
  dashboardIndexCache.regionByCreator = map;
  return map;
}

function getOwnerByCreator() {
  if (dashboardIndexCache.ownerByCreator) return dashboardIndexCache.ownerByCreator;
  const map = new Map();
  for (const row of centerStore.influencers || []) {
    const fields = row.fields || row;
    const owner = readLocalText(fields['负责人']) || readLocalText(fields['负责人名称']) || readLocalText(fields.owner);
    if (!owner) continue;
    const platform = normalizePlatformKey(readLocalText(fields['平台']) || fields.platform);
    const creator = creatorKey(readLocalText(fields['红人名称']));
    const looseCreator = creatorLooseKey(readLocalText(fields['红人名称']));
    const handle = handleFromProfileUrl(fields['红人链接']);
    const keys = [
      creator,
      creator && platform ? `${creator}__${platform}` : '',
      looseCreator ? `loose:${looseCreator}` : '',
      looseCreator && platform ? `loose:${looseCreator}__${platform}` : '',
      handle ? creatorKey(handle) : '',
      handle && platform ? `${creatorKey(handle)}__${platform}` : '',
      handle ? `loose:${creatorLooseKey(handle)}` : ''
    ].filter(Boolean);
    for (const key of keys) {
      if (!map.has(key) || map.get(key) === '未标注负责人') map.set(key, owner);
    }
  }
  dashboardIndexCache.ownerByCreator = map;
  return map;
}

function getVideoRegion(fields, regionByCreator = getRegionByCreator()) {
  const direct = readRegionField(fields);
  if (direct) return direct;
  const creator = creatorKey(readLocalText(fields['红人名称']));
  const loose = creatorLooseKey(readLocalText(fields['红人名称']));
  const platform = normalizePlatformKey(readLocalText(fields['平台']) || fields.platform);
  const manualRegionAliases = {
    anthonymoreno: 'US',
    excdesignsus: 'US',
    teddyvr: 'US',
    tensei: 'UK'
  };
  if (loose && manualRegionAliases[loose]) return manualRegionAliases[loose];
  if (creator && platform && regionByCreator.get(`${creator}__${platform}`)) return regionByCreator.get(`${creator}__${platform}`);
  if (loose && platform && regionByCreator.get(`loose:${loose}__${platform}`)) return regionByCreator.get(`loose:${loose}__${platform}`);
  if (creator && regionByCreator.get(creator)) return regionByCreator.get(creator);
  if (loose && regionByCreator.get(`loose:${loose}`)) return regionByCreator.get(`loose:${loose}`);
  if (loose && loose.length >= 8) {
    for (const [key, region] of regionByCreator.entries()) {
      if (!key.startsWith('loose:')) continue;
      const candidate = key.slice(6);
      if (candidate.length >= 8 && editDistanceWithinOne(loose, candidate)) return region;
    }
  }
  return '未标注地区';
}

function getVideoLocation(fields, locationByCreator = getLocationByCreator(), regionByCreator = getRegionByCreator()) {
  const creator = creatorKey(readLocalText(fields['红人名称']));
  const loose = creatorLooseKey(readLocalText(fields['红人名称']));
  const code = readLocalText(fields['红人编码']) || readLocalText(fields['达人编码']) || readLocalText(fields['KOL编码']);
  const location =
    (code && locationByCreator.get(code.toLowerCase())) ||
    (creator && locationByCreator.get(creator)) ||
    (loose && locationByCreator.get(`loose:${loose}`));
  if (location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng))) return location;
  const region = getVideoRegion(fields, regionByCreator);
  return REGION_LOCATION_FALLBACKS[region] || REGION_LOCATION_FALLBACKS['未标注地区'];
}

function getVideoOwner(fields, ownerByCreator = getOwnerByCreator()) {
  const direct = readLocalText(fields['负责人']) || readLocalText(fields['负责人名称']) || readLocalText(fields.owner);
  if (direct) return direct;
  const creator = creatorKey(readLocalText(fields['红人名称']));
  const loose = creatorLooseKey(readLocalText(fields['红人名称']));
  const platform = normalizePlatformKey(readLocalText(fields['平台']) || fields.platform);
  const manualOwnerAliases = {
    anthonymoreno: 'Ryan',
    excdesignsus: '未标注负责人',
    teddyvr: 'Ryan',
    tensei: 'Zoe'
  };
  if (loose && manualOwnerAliases[loose]) return manualOwnerAliases[loose];
  if (creator && platform && ownerByCreator.get(`${creator}__${platform}`)) return ownerByCreator.get(`${creator}__${platform}`);
  if (loose && platform && ownerByCreator.get(`loose:${loose}__${platform}`)) return ownerByCreator.get(`loose:${loose}__${platform}`);
  if (creator && ownerByCreator.get(creator)) return ownerByCreator.get(creator);
  if (loose && ownerByCreator.get(`loose:${loose}`)) return ownerByCreator.get(`loose:${loose}`);
  if (loose && loose.length >= 8) {
    for (const [key, owner] of ownerByCreator.entries()) {
      if (!key.startsWith('loose:')) continue;
      const candidate = key.slice(6);
      if (candidate.length >= 8 && editDistanceWithinOne(loose, candidate)) return owner;
    }
  }
  return '未标注负责人';
}

function periodBounds(period) {
  if (period === 'week') return centerDashboard.currentWeek || {};
  if (period === 'month') return centerDashboard.currentMonth || {};
  if (period === 'custom') return { customStart: customRange.start, customEnd: customRange.end };
  return {};
}

function isVideoInPeriod(fields, period) {
  if (period === 'total') return true;
  const publishedAt = videoPublishedAt(fields);
  if (!publishedAt) return false;
  const bounds = periodBounds(period);
  const start = parseDateValue(bounds.weekStart || bounds.monthStart || bounds.customStart);
  const end = parseDateValue(bounds.weekEnd || bounds.monthEnd || bounds.customEnd);
  if (!start || !end) return true;
  return publishedAt >= start && publishedAt < end;
}

function videoPublishedAt(fields) {
  return parseDateValue(fields.timestamp);
}

function normalizeMapCountryName(country) {
  const raw = String(country || '').trim();
  return COUNTRY_TO_MAP_NAME[raw] || raw || 'Unknown';
}

function normalizeCountryRegion(country) {
  const raw = String(country || '').trim();
  return COUNTRY_TO_REGION[raw] || raw || 'Other';
}

function normalizeVideoRow(fields, helpers = {}) {
  const regionByCreator = helpers.regionByCreator || getRegionByCreator();
  const ownerByCreator = helpers.ownerByCreator || getOwnerByCreator();
  const locationByCreator = helpers.locationByCreator || getLocationByCreator();
  const followerByCreator = helpers.followerByCreator || getFollowerByCreator();
  const creatorName = readLocalText(fields['红人名称']) || '-';
  const location = getVideoLocation(fields, locationByCreator, regionByCreator);
  const views = dashboardVoiceViews(fields);
  const likes = rawNumber(fields.likesCount);
  const comments = rawNumber(fields.commentsCount);
  const publishedAt = videoPublishedAt(fields);
  const platform = platformLabel(readLocalText(fields['平台']));
  const region = getVideoRegion(fields, regionByCreator);
  const owner = getVideoOwner(fields, ownerByCreator);
  const recordId = readLocalText(fields.__recordId || fields.recordId);
  return {
    id: recordId || readLocalText(fields.postId || fields.id) || videoUrl(fields) || `${creatorName}_${fields.timestamp || ''}`,
    recordId,
    creatorName,
    platform,
    videoUrl: videoUrl(fields),
    videoTitle: readLocalText(fields.title) || readLocalText(fields.caption) || readLocalText(fields['视频标题']) || '',
    publishDate: publishedAt,
    country: location.country || region || 'Unknown',
    mapCountry: normalizeMapCountryName(location.country || region),
    state: location.state || '',
    region: normalizeCountryRegion(location.country || region || region),
    owner,
    views,
    currentViews: latestKnownVideoViews(fields),
    mature7dViews: sevenDayVideoViews(fields),
    likes,
    comments,
    engagementRate: views ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0,
    followers: followerByCreator.get(creatorKey(creatorName)) || 0,
    raw: fields
  };
}

function normalizeData(rawRows = []) {
  const helpers = getDashboardHelpers();
  return rawRows.map((fields) => normalizeVideoRow(fields, helpers));
}

function videoStatus(row) {
  if (!row.publishDate || !row.views || row.region === '未标注地区' || row.owner === '未标注负责人') return { label: 'Missing Data', level: 'missing' };
  const age = daysSince(row.publishDate);
  if (age !== null && age <= 3) return { label: 'New', level: 'new' };
  if (row.views >= 50000 || row.engagementRate >= 5) return { label: 'High Performance', level: 'high' };
  if (age !== null && (age >= 6 && age <= 8 || age >= 28 && age <= 31)) return { label: 'Need Follow-up', level: 'follow' };
  if (row.views < 1000) return { label: 'Low Performance', level: 'low' };
  return { label: 'Normal', level: 'normal' };
}

function passesDashboardFilters(fields, helpers = getDashboardHelpers()) {
  const normalized = normalizeVideoRow(fields, helpers);
  if (dashboardFilters.platform !== 'all' && normalized.platform !== dashboardFilters.platform) return false;
  if (dashboardFilters.region !== 'all' && normalized.region !== dashboardFilters.region && normalized.country !== dashboardFilters.region) return false;
  if (dashboardFilters.owner !== 'all' && normalized.owner !== dashboardFilters.owner) return false;
  if (dashboardFilters.country !== 'all') {
    if (dashboardFilters.country === EU_GROUP_FILTER) {
      if (!isEuropeGroupRow(normalized)) return false;
    } else if (normalized.mapCountry !== dashboardFilters.country && normalized.country !== dashboardFilters.country) {
      return false;
    }
  }
  return true;
}

function hasDashboardFilterScope() {
  return Object.values(dashboardFilters).some((value) => value && value !== 'all');
}

function normalizeInfluencerRow(fields, helpers = getDashboardHelpers()) {
  const creatorName = readLocalText(fields['红人名称']) || '-';
  const platform = platformLabel(readLocalText(fields['平台']));
  const region = readRegionField(fields) || getVideoRegion(fields, helpers.regionByCreator);
  const owner = readLocalText(fields['负责人']) || readLocalText(fields['负责人名称']) || getVideoOwner(fields, helpers.ownerByCreator);
  return {
    creatorName,
    platform,
    region,
    owner,
    fields
  };
}

function passesInfluencerFilters(fields, helpers = getDashboardHelpers()) {
  const normalized = normalizeInfluencerRow(fields, helpers);
  if (dashboardFilters.platform !== 'all' && normalized.platform !== dashboardFilters.platform) return false;
  if (dashboardFilters.region !== 'all' && normalized.region !== dashboardFilters.region) return false;
  if (dashboardFilters.owner !== 'all' && normalized.owner !== dashboardFilters.owner) return false;
  return true;
}

function fieldsWithRecordId(row, index = 0, prefix = 'local') {
  const fields = { ...(row.fields || row) };
  Object.defineProperty(fields, '__recordId', {
    value: row.id || row.recordId || `${prefix}_${index + 1}`,
    enumerable: false,
    configurable: true
  });
  return fields;
}

function getScopedInfluencerRows() {
  const helpers = getDashboardHelpers();
  return (centerStore.influencers || [])
    .map((row) => row.fields || row)
    .filter((fields) => passesInfluencerFilters(fields, helpers));
}

function daysSince(date, now = new Date()) {
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function getScopedVideoRows(period = centerPeriod) {
  const cacheKey = `${period}|${currentFilterKey()}`;
  if (scopedVideoRowsCache.has(cacheKey)) return scopedVideoRowsCache.get(cacheKey);
  const helpers = getDashboardHelpers();
  const rows = (centerStore.videos || [])
    .map((row, index) => fieldsWithRecordId(row, index, 'local_video'))
    .filter((fields) => isVideoInPeriod(fields, period))
    .filter((fields) => passesDashboardFilters(fields, helpers));
  scopedVideoRowsCache.set(cacheKey, rows);
  return rows;
}

function getScopedVideoSummary(period = centerPeriod) {
  const rows = getScopedVideoRows(period);
  return {
    videos: rows.length,
    creators: new Set(rows.map((fields) => creatorKey(readLocalText(fields['红人名称']))).filter(Boolean)).size,
    views: rows.reduce((sum, fields) => sum + dashboardVoiceViews(fields), 0),
    currentViews: rows.reduce((sum, fields) => sum + latestKnownVideoViews(fields), 0),
    mature7dViews: rows.reduce((sum, fields) => sum + sevenDayVideoViews(fields), 0),
    mature7dVideos: rows.filter((fields) => sevenDayVideoViews(fields) > 0).length
  };
}

function summarizeVideoRowsForRange(rows, startKey, endKey, template = {}) {
  const start = new Date(template[startKey] || '');
  const end = new Date(template[endKey] || '');
  const scoped = rows.filter((fields) => {
    const publishedAt = videoPublishedAt(fields);
    if (!publishedAt || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return publishedAt >= start && publishedAt < end;
  });
  return {
    ...template,
    videos: scoped.length,
    creators: new Set(scoped.map((fields) => creatorKey(readLocalText(fields['红人名称']))).filter(Boolean)).size,
    views: scoped.reduce((sum, fields) => sum + dashboardVoiceViews(fields), 0),
    currentViews: scoped.reduce((sum, fields) => sum + latestKnownVideoViews(fields), 0),
    mature7dViews: scoped.reduce((sum, fields) => sum + sevenDayVideoViews(fields), 0),
    mature7dVideos: scoped.filter((fields) => sevenDayVideoViews(fields) > 0).length
  };
}

function getWeeklyTrendRows() {
  const rows = centerDashboard.weekly || [];
  if (!hasDashboardFilterScope()) {
    return rows.map((row) => ({
      ...row,
      currentViews: rawNumber(row.views),
      views: dashboardVoiceMode === 'mature' ? rawNumber(row.mature7dViews) : rawNumber(row.views)
    }));
  }
  const scopedVideos = getScopedVideoRows('total');
  return rows.map((row) => summarizeVideoRowsForRange(scopedVideos, 'weekStart', 'weekEnd', row));
}

function getMonthlyTrendRows() {
  const rows = centerDashboard.monthly || [];
  if (!hasDashboardFilterScope()) {
    return rows.map((row) => ({
      ...row,
      currentViews: rawNumber(row.views),
      views: dashboardVoiceMode === 'mature' ? rawNumber(row.mature7dViews) : rawNumber(row.views)
    }));
  }
  const scopedVideos = getScopedVideoRows('total');
  return rows.map((row) => summarizeVideoRowsForRange(scopedVideos, 'monthStart', 'monthEnd', row));
}

function selectedPeriodLabel() {
  if (centerPeriod === 'week') return '周维度';
  if (centerPeriod === 'month') return '月维度';
  if (centerPeriod === 'total') return '总维度';
  if (customRange.start && customRange.end) {
    const inclusiveEnd = new Date(new Date(customRange.end).getTime() - 24 * 60 * 60 * 1000);
    return `${dateOnlyLabel(customRange.start)} - ${dateOnlyLabel(inclusiveEnd)}`;
  }
  return '自定义时间';
}

function rangeLabel(start, endExclusive) {
  const startDate = parseDateValue(start);
  let endDate = parseDateValue(endExclusive);
  if (!startDate || !endDate) return '';
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (endDate > tomorrow) endDate = tomorrow;
  const inclusiveEnd = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
  return `${dateOnlyLabel(startDate)} - ${dateOnlyLabel(inclusiveEnd)}`;
}

function shortRangeLabel(start, endExclusive) {
  const startDate = parseDateValue(start);
  const endDate = parseDateValue(endExclusive);
  if (!startDate || !endDate) return '-';
  const inclusiveEnd = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
  return `${shortDate(startDate)}-${shortDate(inclusiveEnd)}`;
}

function summarizeRowsBetween(rows, start, end) {
  const startDate = parseDateValue(start);
  const endDate = parseDateValue(end);
  const scoped = rows.filter((fields) => {
    const publishedAt = videoPublishedAt(fields);
    return publishedAt && startDate && endDate && publishedAt >= startDate && publishedAt < endDate;
  });
  return {
    videos: scoped.length,
    creators: new Set(scoped.map((fields) => creatorKey(readLocalText(fields['红人名称']))).filter(Boolean)).size,
    views: scoped.reduce((sum, fields) => sum + dashboardVoiceViews(fields), 0),
    currentViews: scoped.reduce((sum, fields) => sum + latestKnownVideoViews(fields), 0),
    mature7dViews: scoped.reduce((sum, fields) => sum + sevenDayVideoViews(fields), 0),
    mature7dVideos: scoped.filter((fields) => sevenDayVideoViews(fields) > 0).length
  };
}

function numberDelta(current, previous, suffix = '') {
  const now = rawNumber(current);
  const before = rawNumber(previous);
  const diff = now - before;
  const sign = diff > 0 ? '+' : '';
  const className = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  return {
    className,
    text: `${sign}${centerNumber(diff)}${suffix}`
  };
}

function periodCompareData(period) {
  if (period === 'week') {
    const rows = getWeeklyTrendRows();
    const current = rows.at(-1) || {};
    const previous = rows.at(-2) || {};
    return {
      label: rangeLabel(current.weekStart, current.weekEnd) || '当前周报周期',
      compareLabel: rangeLabel(previous.weekStart, previous.weekEnd) || '上一周',
      current: {
        videos: rawNumber(current.videos),
        creators: rawNumber(current.creators),
        views: dashboardVoiceMode === 'mature' ? rawNumber(current.mature7dViews) : rawNumber(current.currentViews ?? current.views),
        mature7dVideos: rawNumber(current.mature7dVideos)
      },
      previous: {
        videos: rawNumber(previous.videos),
        creators: rawNumber(previous.creators),
        views: dashboardVoiceMode === 'mature' ? rawNumber(previous.mature7dViews) : rawNumber(previous.currentViews ?? previous.views),
        mature7dVideos: rawNumber(previous.mature7dVideos)
      },
      description: dashboardVoiceMode === 'mature'
        ? '7日成熟用于公平复盘；本周未满7天的视频不会提前计入。'
        : '即时播放使用最近一次抓取累计值，适合判断当前增长与爆款。'
    };
  }
  if (period === 'month') {
    const rows = getMonthlyTrendRows();
    const current = rows.at(-1) || {};
    const previous = rows.at(-2) || {};
    return {
      label: rangeLabel(current.monthStart, current.monthEnd) || '当前月',
      compareLabel: rangeLabel(previous.monthStart, previous.monthEnd) || '上月',
      current: {
        videos: rawNumber(current.videos),
        creators: rawNumber(current.creators),
        views: dashboardVoiceMode === 'mature' ? rawNumber(current.mature7dViews) : rawNumber(current.currentViews ?? current.views),
        mature7dVideos: rawNumber(current.mature7dVideos)
      },
      previous: {
        videos: rawNumber(previous.videos),
        creators: rawNumber(previous.creators),
        views: dashboardVoiceMode === 'mature' ? rawNumber(previous.mature7dViews) : rawNumber(previous.currentViews ?? previous.views),
        mature7dVideos: rawNumber(previous.mature7dVideos)
      },
      description: dashboardVoiceMode === 'mature'
        ? '按自然月查看已成熟视频表现，避免发布时间不同造成偏差。'
        : '按自然月查看最近抓取累计播放，及时发现正在增长的内容。'
    };
  }
  if (period === 'custom' && customRange.start && customRange.end) {
    const rows = getScopedVideoRows('total');
    const start = parseDateValue(customRange.start);
    const end = parseDateValue(customRange.end);
    const span = start && end ? end.getTime() - start.getTime() : 0;
    const prevStart = span ? new Date(start.getTime() - span).toISOString() : '';
    const prevEnd = start ? start.toISOString() : '';
    return {
      label: rangeLabel(customRange.start, customRange.end),
      compareLabel: rangeLabel(prevStart, prevEnd) || '上一等长周期',
      current: summarizeRowsBetween(rows, customRange.start, customRange.end),
      previous: summarizeRowsBetween(rows, prevStart, prevEnd),
      description: '按你选择的日期区间统计，环比为前一个等长周期。'
    };
  }
  const total = getScopedVideoSummary('total');
  const month = getScopedVideoSummary('month');
  return {
    label: '全部已登记视频',
    compareLabel: '本月贡献',
    current: total,
    previous: month,
    description: '总维度展示当前库内累计视频，右侧对比显示本月在累计中的贡献。'
  };
}

function setDeltaText(target, delta, prefix = '') {
  if (!target) return;
  target.textContent = `${prefix}${delta.text}`;
  target.classList.remove('up', 'down', 'flat');
  target.classList.add(delta.className);
}

function renderPeriodInsight() {
  const data = periodCompareData(centerPeriod);
  const videoDelta = numberDelta(data.current.videos, data.previous.videos, ' 条视频');
  const creatorDelta = numberDelta(data.current.creators, data.previous.creators, ' 位达人');
  const viewsDelta = numberDelta(data.current.views, data.previous.views, ` ${dashboardVoiceLabel()}`);
  if (centerEls.periodInsightStrip) {
    centerEls.periodInsightStrip.innerHTML = `
      <div>
        <span>${escapeHtml(selectedPeriodLabel())}</span>
        <strong>${escapeHtml(data.label || '当前周期')}</strong>
        <p>${escapeHtml(data.description)}</p>
      </div>
      <dl>
        <div><dt>对比周期</dt><dd>${escapeHtml(data.compareLabel || '-')}</dd></div>
        <div><dt>上线视频</dt><dd class="${videoDelta.className}">${escapeHtml(videoDelta.text)}</dd></div>
        <div><dt>上线达人</dt><dd class="${creatorDelta.className}">${escapeHtml(creatorDelta.text)}</dd></div>
        <div><dt>${escapeHtml(dashboardVoiceLabel())}</dt><dd class="${viewsDelta.className}">${escapeHtml(viewsDelta.text)}</dd></div>
      </dl>`;
  }
  syncVoiceMetricLabels();
  setDeltaText(centerEls.weekDelta, numberDelta(getScopedVideoSummary('week').videos, (getWeeklyTrendRows().at(-2) || {}).videos, ' 条'), '较上周 ');
  setDeltaText(centerEls.monthDelta, numberDelta(getScopedVideoSummary('month').videos, (getMonthlyTrendRows().at(-2) || {}).videos, ' 条'), '较上月 ');
  if (centerEls.totalDelta) centerEls.totalDelta.textContent = `本月贡献 ${centerNumber(getScopedVideoSummary('month').videos)} 条`;
  const customData = periodCompareData('custom');
  if (centerEls.customDelta) centerEls.customDelta.textContent = customRange.start && customRange.end ? `较上一等长周期 ${numberDelta(customData.current.videos, customData.previous.videos, ' 条').text}` : '选择日期后显示环比';
}

function updateDashboardControlState() {
  document.body.classList.toggle('custom-period-active', centerPeriod === 'custom');
  const filterLabels = [];
  if (dashboardFilters.platform !== 'all') filterLabels.push(`平台：${dashboardFilters.platform}`);
  if (dashboardFilters.region !== 'all') filterLabels.push(`区域：${dashboardFilters.region}`);
  if (dashboardFilters.owner !== 'all') filterLabels.push(`负责人：${dashboardFilters.owner}`);
  if (dashboardFilters.country !== 'all') filterLabels.push(`地图：${mapFilterLabel(dashboardFilters.country)}`);
  const hasFilters = filterLabels.length > 0;
  if (centerEls.filterSummary) {
    centerEls.filterSummary.textContent = `${selectedPeriodLabel()} · ${hasFilters ? filterLabels.join(' / ') : '全部数据'}`;
    centerEls.filterSummary.classList.toggle('is-active', hasFilters);
  }
  centerEls.btnResetDashboardFilters?.classList.toggle('is-active', hasFilters);
}

function getCreatorVideoStats(period = centerPeriod) {
  const followerByCreator = getFollowerByCreator();
  const ownerByCreator = getOwnerByCreator();
  const regionByCreator = getRegionByCreator();
  const stats = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const creator = readLocalText(fields['红人名称']) || '-';
    const key = creatorKey(creator);
    if (!key) continue;
    if (!stats.has(key)) {
      const followers = followerByCreator.get(key) || 0;
      const tier = getInfluencerTier(followers);
      stats.set(key, {
        creator,
        followers,
        tier: tier.key,
        tierLabel: tier.label,
        owner: getVideoOwner(fields, ownerByCreator),
        region: getVideoRegion(fields, regionByCreator),
        videos: 0,
        views: 0,
        latestAt: null,
        topUrl: '',
        topViews: 0
      });
    }
    const item = stats.get(key);
    const views = dashboardVoiceViews(fields);
    const publishedAt = videoPublishedAt(fields);
    item.videos += 1;
    item.views += views;
    if (!item.latestAt || (publishedAt && publishedAt > item.latestAt)) item.latestAt = publishedAt;
    if (views >= item.topViews) {
      item.topViews = views;
      item.topUrl = videoUrl(fields);
    }
  }
  return [...stats.values()].map((item) => ({
    ...item,
    avgViews: item.videos ? Math.round(item.views / item.videos) : 0
  }));
}

function getScopedVideoLeaderboard(period = centerPeriod) {
  return getScopedVideoRows(period)
    .map((fields) => {
      const views = dashboardVoiceViews(fields);
      const likes = rawNumber(fields.likesCount);
      const comments = rawNumber(fields.commentsCount);
      return {
        creator: readLocalText(fields['红人名称']) || '-',
        platform: platformLabel(readLocalText(fields['平台'])),
        publishedAt: fields.timestamp,
        postUrl: videoUrl(fields),
        views,
        engagementRate: views ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0
      };
    })
    .sort((a, b) => b.views - a.views || b.engagementRate - a.engagementRate)
    .slice(0, 10)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function getQualityIssues() {
  const influencers = getScopedInfluencerRows();
  const videos = getScopedVideoRows('total');
  const missingFollowers = influencers.filter((row) => {
    const fields = row.fields || row;
    return !rawNumber(readLocalText(fields['红人粉丝数据']) || fields.followers);
  }).length;
  const missingVideoTime = videos.filter((fields) => !videoPublishedAt(fields)).length;
  const zeroViewVideos = videos.filter((fields) => !videoViews(fields)).length;
  const urls = new Map();
  for (const row of videos) {
    const url = videoUrl(row);
    if (!url) continue;
    urls.set(url, (urls.get(url) || 0) + 1);
  }
  const duplicateVideos = [...urls.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
  return {
    missingFollowers,
    missingVideoTime,
    zeroViewVideos,
    duplicateVideos,
    totalInfluencers: influencers.length,
    totalVideos: videos.length
  };
}

function getLifecycleStats() {
  const now = new Date();
  const rows = getScopedVideoRows('total');
  const milestoneTypes = getMilestoneTypesByPostKey();
  const stats = {
    firstSevenDays: 0,
    sevenDayDue: 0,
    thirtyDayTracking: 0,
    thirtyDayDue: 0,
    stopTracking: 0,
    missingTime: 0
  };
  for (const fields of rows) {
    if (readLocalText(fields['是否监控']) === '否') continue;
    const publishedAt = videoPublishedAt(fields);
    const age = daysSince(publishedAt, now);
    if (age === null) {
      stats.missingTime += 1;
      continue;
    }
    const types = milestoneTypes.get(videoPostKey(fields)) || new Set();
    const key = videoPostKey(fields);
    const has7d = types.has('milestone_7d') || hasValidSnapshotAfterDays(key, publishedAt, 7, 30);
    const has30d = types.has('milestone_30d');
    if (age <= 7) stats.firstSevenDays += 1;
    if (age >= 7 && age < 30 && !has7d) stats.sevenDayDue += 1;
    if (age > 7 && age <= 30) stats.thirtyDayTracking += 1;
    if (age >= 30 && !has30d) stats.thirtyDayDue += 1;
    if (age > 30 && has30d) stats.stopTracking += 1;
  }
  return stats;
}

function formatDelta(current, previous) {
  const now = rawNumber(current);
  const before = rawNumber(previous);
  if (!before && !now) return { text: '暂无变化', className: 'flat' };
  if (!before) return { text: '上周无数据，本周启动', className: 'up' };
  const percent = ((now - before) / before) * 100;
  return {
    text: `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}% vs 上周`,
    className: percent >= 0 ? 'up' : 'down'
  };
}

function latestWeeklyPair() {
  const rows = getWeeklyTrendRows().filter(Boolean);
  const current = rows[rows.length - 1] || {};
  const previous = rows[rows.length - 2] || {};
  return { current, previous, rows };
}

function chartPoint(value, min, max, index, count, width, height, pad) {
  const x = count <= 1 ? width / 2 : pad + (index * (width - pad * 2)) / (count - 1);
  const ratio = max === min ? 0.5 : (Number(value) - min) / (max - min);
  const y = height - pad - ratio * (height - pad * 2);
  return [x, y];
}

function getChartInstance(target, existing) {
  if (!target || !window.echarts) return null;
  return existing || window.echarts.init(target, null, { renderer: 'canvas' });
}

function resizeChartAfterLayout(chart) {
  if (!chart) return;
  requestAnimationFrame(() => chart.resize());
  window.setTimeout(() => chart.resize(), 80);
}

function renderLineChart(target, rows) {
  const data = Array.isArray(rows) && rows.length ? rows : [];
  if (!target || !data.length) {
    if (target) target.innerHTML = '<div class="empty-cell">暂无趋势数据</div>';
    return;
  }
  weeklyTrendEchart = getChartInstance(target, weeklyTrendEchart);
  if (!weeklyTrendEchart) return;
  const labels = data.map((row) => shortRangeLabel(row.weekStart, row.weekEnd));
  weeklyTrendEchart.setOption({
    backgroundColor: 'transparent',
    color: ['#33D6C5', '#4DA3FF', '#FFB454'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#121C2B',
      borderColor: 'rgba(255,255,255,.1)',
      textStyle: { color: '#F7F8FA' },
      formatter: (params = []) => {
        const index = params[0]?.dataIndex ?? 0;
        const row = data[index] || {};
        const title = rangeLabel(row.weekStart, row.weekEnd) || labels[index] || '';
        const lines = params.map((item) => {
          const value = item.seriesName.includes('声量') ? centerNumber(item.value) : centerNumber(item.value);
          return `${item.marker}${item.seriesName}：${value}`;
        });
        return [title, ...lines].join('<br/>');
      }
    },
    legend: { top: 0, right: 6, textStyle: { color: '#A8B3C7' } },
    grid: { left: 42, right: 22, top: 44, bottom: 42 },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } }, axisLabel: { color: '#A8B3C7', interval: 0, rotate: data.length > 6 ? 16 : 0 } },
    yAxis: [
      { type: 'value', name: '视频', axisLabel: { color: '#A8B3C7' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.07)' } } },
      { type: 'value', name: '播放', axisLabel: { color: '#A8B3C7', formatter: (value) => centerNumber(value) }, splitLine: { show: false } }
    ],
    series: [
      { name: '上线视频', type: 'line', smooth: true, areaStyle: { opacity: 0.1 }, data: data.map((row) => Number(row.videos) || 0) },
      { name: '即时累计播放', type: 'line', yAxisIndex: 1, smooth: true, areaStyle: { opacity: 0.08 }, data: data.map((row) => Number(row.currentViews ?? row.views) || 0) },
      { name: '7日成熟声量', type: 'line', yAxisIndex: 1, smooth: true, lineStyle: { type: 'dashed', width: 2 }, data: data.map((row) => Number(row.mature7dViews) || 0) }
    ]
  }, true);
  const current = data.at(-1) || {};
  const matureCount = rawNumber(current.mature7dVideos);
  const videoCount = rawNumber(current.videos);
  const coverage = videoCount ? Math.round((matureCount / videoCount) * 100) : 0;
  if (centerEls.weeklyTrendCoverage) {
    centerEls.weeklyTrendCoverage.textContent = `即时累计 + 7日成熟 · 成熟覆盖 ${matureCount}/${videoCount}（${coverage}%）`;
  }
  resizeChartAfterLayout(weeklyTrendEchart);
}

function renderBarChart(target, rows) {
  const data = getPlatformStats(centerPeriod);
  if (!target || !data.length) {
    if (target) target.innerHTML = '<div class="empty-cell">暂无平台数据</div>';
    return;
  }
  platformCompareChart = getChartInstance(target, platformCompareChart);
  if (!platformCompareChart) return;
  platformCompareChart.setOption({
    backgroundColor: 'transparent',
    color: ['#4DA3FF', '#FFB454', '#33D6C5'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#121C2B', borderColor: 'rgba(255,255,255,.1)', textStyle: { color: '#F7F8FA' } },
    legend: { top: 0, right: 6, textStyle: { color: '#A8B3C7' } },
    grid: { left: 42, right: 22, top: 44, bottom: 42 },
    xAxis: { type: 'category', data: data.map((row) => row.platform), axisLabel: { color: '#A8B3C7', interval: 0, rotate: data.length > 3 ? 18 : 0 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } } },
    yAxis: [
      { type: 'value', name: '播放', axisLabel: { color: '#A8B3C7', formatter: (value) => centerNumber(value) }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.07)' } } },
      { type: 'value', name: '视频', axisLabel: { color: '#A8B3C7' }, splitLine: { show: false } }
    ],
    series: [
      { name: '即时累计播放', type: 'bar', barMaxWidth: 28, data: data.map((row) => row.currentViews) },
      { name: '7日成熟声量', type: 'bar', barMaxWidth: 28, data: data.map((row) => row.mature7dViews) },
      { name: '视频数', type: 'line', yAxisIndex: 1, smooth: true, data: data.map((row) => row.videos) }
    ]
  }, true);
  resizeChartAfterLayout(platformCompareChart);
}

function getPlatformStats(period = centerPeriod) {
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const platform = readLocalText(fields['平台']) || 'unknown';
    const key = platformLabel(platform);
    const views = dashboardVoiceViews(fields);
    const currentViews = latestKnownVideoViews(fields);
    const mature7dViews = sevenDayVideoViews(fields);
    const creator = readLocalText(fields['红人名称']) || '-';
    const url = videoUrl(fields);
    if (!map.has(key)) {
      map.set(key, {
        platform: key,
        rawPlatform: platform,
        videos: 0,
        views: 0,
        currentViews: 0,
        mature7dViews: 0,
        mature7dVideos: 0,
        topCreator: '-',
        topViews: 0,
        topUrl: ''
      });
    }
    const stat = map.get(key);
    stat.videos += 1;
    stat.views += views;
    stat.currentViews += currentViews;
    stat.mature7dViews += mature7dViews;
    if (mature7dViews > 0) stat.mature7dVideos += 1;
    if (views >= stat.topViews) {
      stat.topCreator = creator;
      stat.topViews = views;
      stat.topUrl = url;
    }
  }
  return [...map.values()]
    .map((row) => ({ ...row, avgViews: row.videos ? Math.round(row.views / row.videos) : 0 }))
    .sort((a, b) => b.views - a.views);
}

function renderCommandKpis() {
  renderPeriodInsight();
  const weekSummary = getScopedVideoSummary('week');
  const monthSummary = getScopedVideoSummary('month');
  const totalSummary = getScopedVideoSummary('total');
  const summary = getScopedVideoSummary(centerPeriod);
  const region = getRegionStats(centerPeriod)[0] || {};
  const platform = getPlatformStats(centerPeriod)[0] || {};
  const quality = getQualityIssues();
  const lifecycle = getLifecycleStats();
  const needFollowup = quality.missingFollowers + quality.missingVideoTime + quality.zeroViewVideos + lifecycle.sevenDayDue + lifecycle.thirtyDayDue;
  if (centerEls.weekVideos) centerEls.weekVideos.textContent = centerNumber(weekSummary.videos);
  if (centerEls.weekCreators) centerEls.weekCreators.textContent = centerNumber(weekSummary.creators);
  if (centerEls.weekViews) centerEls.weekViews.textContent = centerNumber(weekSummary.views);
  if (centerEls.monthVideos) centerEls.monthVideos.textContent = centerNumber(monthSummary.videos);
  if (centerEls.monthCreators) centerEls.monthCreators.textContent = centerNumber(monthSummary.creators);
  if (centerEls.monthViews) centerEls.monthViews.textContent = centerNumber(monthSummary.views);
  if (centerEls.totalVideos) centerEls.totalVideos.textContent = centerNumber(totalSummary.videos);
  if (centerEls.totalCreators) centerEls.totalCreators.textContent = centerNumber(totalSummary.creators);
  if (centerEls.totalViews) centerEls.totalViews.textContent = centerNumber(totalSummary.views);
  if (centerEls.kpiAvgViews) centerEls.kpiAvgViews.textContent = centerNumber(summary.videos ? Math.round(summary.views / summary.videos) : 0);
  if (centerEls.kpiTopRegion) centerEls.kpiTopRegion.textContent = region.region || '-';
  if (centerEls.kpiTopPlatform) centerEls.kpiTopPlatform.textContent = platform.platform || '-';
  if (centerEls.kpiNeedFollowup) centerEls.kpiNeedFollowup.textContent = centerNumber(needFollowup);
}

function renderFocusBrief() {
  if (!centerEls.focusBrief) return;
  const summary = getScopedVideoSummary(centerPeriod);
  const { current, previous } = latestWeeklyPair();
  const platform = getPlatformStats(centerPeriod)[0] || null;
  const regions = getRegionStats(centerPeriod).filter((row) => row.region !== '未标注地区');
  const region = regions[0] || null;
  const video = getScopedVideoLeaderboard(centerPeriod)[0] || null;
  const quality = getQualityIssues();
  const lifecycle = getLifecycleStats();
  const needFollowup = quality.missingFollowers + quality.missingVideoTime + quality.zeroViewVideos + lifecycle.sevenDayDue + lifecycle.thirtyDayDue;
  const delta = formatDelta(current.videos, previous.videos);
  const momentumWidth = previous.videos ? Math.min(100, Math.max(8, Math.round((rawNumber(current.videos) / Math.max(1, rawNumber(previous.videos))) * 50))) : summary.videos ? 72 : 8;
  const platformShare = summary.views && platform ? Math.round((platform.views / Math.max(1, summary.views)) * 100) : 0;
  const riskTotal = quality.totalVideos + quality.totalInfluencers;
  const riskWidth = riskTotal ? Math.min(100, Math.max(8, Math.round((needFollowup / Math.max(1, riskTotal)) * 100))) : needFollowup ? 50 : 8;
  const cards = [
    {
      tone: delta.className,
      label: '周期动量',
      value: summary.videos ? `${centerNumber(summary.videos)} 条` : '暂无上线',
      title: delta.text,
      note: `${selectedPeriodLabel()} ${centerNumber(summary.creators)} 位达人 · ${centerNumber(summary.views)} ${dashboardVoiceLabel()}`,
      meta: ['看趋势', `${centerNumber(current.videos)} / ${centerNumber(previous.videos)} 周对比`],
      jump: 'dashboardTrends',
      width: momentumWidth
    },
    {
      tone: platform?.views ? 'good' : 'flat',
      label: '主攻平台',
      value: platform?.platform || '-',
      title: platform?.topCreator ? `${platform.topCreator} 带动当前爆点` : '当前范围暂无平台爆点',
      note: platform ? `${centerNumber(platform.views)} ${dashboardVoiceLabel()} · ${centerNumber(platform.videos)} 条视频 · 均播 ${centerNumber(platform.avgViews)}` : '切换时间或平台后这里会自动更新',
      meta: ['看平台', `${platformShare}% 声量占比`],
      jump: 'dashboardPlatform',
      width: platformShare || 8
    },
    {
      tone: region?.share >= 70 ? 'warn' : region?.share ? 'good' : 'flat',
      label: '地区集中度',
      value: region?.region || '-',
      title: region?.share >= 70 ? '声量集中，注意区域依赖' : region ? '地区贡献相对可控' : '暂无地区判断',
      note: region ? `${region.share}% ${dashboardVoiceLabel()}来自 ${region.region} · ${centerNumber(region.videos)} 条视频` : '补齐地区字段后会自动形成判断',
      meta: ['看地区', region ? `${centerNumber(region.creatorsCount)} 位达人` : '待补字段'],
      jump: 'dashboardRegions',
      width: region?.share || 8
    },
    {
      tone: needFollowup ? 'danger' : 'good',
      label: '跟进风险',
      value: needFollowup ? centerNumber(needFollowup) : '稳定',
      title: needFollowup ? '需要处理数据和节点积压' : '当前没有明显积压',
      note: needFollowup
        ? `7天节点 ${centerNumber(lifecycle.sevenDayDue)} 条 · 30天复核 ${centerNumber(lifecycle.thirtyDayDue)} 条 · 缺粉 ${centerNumber(quality.missingFollowers)} 位`
        : video
        ? `优先复盘 ${video.creator} · ${centerNumber(video.views)} ${dashboardVoiceLabel()}`
        : '可以继续看榜单寻找复投候选',
      meta: [needFollowup ? '看待办' : '看榜单', video ? `${video.platform} · ${shortDate(video.publishedAt)}` : selectedPeriodLabel()],
      jump: needFollowup ? 'dashboardOpsMonitor' : 'dashboardLeaderboards',
      width: riskWidth
    }
  ];

  centerEls.focusBrief.innerHTML = cards
    .map((card) => `<button type="button" class="dashboard-focus-card ${escapeHtml(card.tone)}" data-dashboard-jump="${escapeHtml(card.jump)}">
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <b>${escapeHtml(card.title)}</b>
      <p>${escapeHtml(card.note)}</p>
      <i><em style="width:${Math.min(100, Math.max(8, card.width))}%"></em></i>
      <small>${card.meta.map((item) => `<em>${escapeHtml(item)}</em>`).join('')}</small>
    </button>`)
    .join('');
}

function renderOpsCommandCenter() {
  const quality = getQualityIssues();
  const lifecycle = getLifecycleStats();
  const { current, previous } = latestWeeklyPair();
  const topPlatform = getPlatformStats()[0] || {};
  const activeCreators = rawNumber(current.creators);
  const previousCreators = rawNumber(previous.creators);
  const followerPenalty = quality.totalInfluencers ? Math.min(22, Math.round((quality.missingFollowers / quality.totalInfluencers) * 26)) : 0;
  const videoQualityPenalty = quality.totalVideos
    ? Math.min(26, Math.round(((quality.zeroViewVideos + quality.missingVideoTime + quality.duplicateVideos) / quality.totalVideos) * 30))
    : 0;
  const trackingPenalty = Math.min(18, lifecycle.stopTracking * 2 + lifecycle.missingTime);
  const momentumPenalty = previousCreators && activeCreators < previousCreators ? Math.min(12, Math.round(((previousCreators - activeCreators) / previousCreators) * 18)) : 0;
  const healthScore = Math.max(0, 100 - followerPenalty - videoQualityPenalty - trackingPenalty - momentumPenalty);

  if (centerEls.opsHealthScore) centerEls.opsHealthScore.textContent = healthScore;
  if (centerEls.opsTicker) {
    const tickerItems = [
      `周报周期 ${centerNumber(current.videos)} 条视频 / ${centerNumber(dashboardVoiceMode === 'mature' ? current.mature7dViews : current.currentViews ?? current.views)} ${dashboardVoiceLabel()}`,
      topPlatform.platform ? `${topPlatform.platform} 当前最强，${centerNumber(topPlatform.views)} ${dashboardVoiceLabel()}` : '暂无平台表现数据',
      lifecycle.sevenDayDue ? `${centerNumber(lifecycle.sevenDayDue)} 条视频接近 7 天更新节点` : '7 天节点暂无积压',
      quality.missingFollowers ? `${centerNumber(quality.missingFollowers)} 位达人缺粉丝数` : '粉丝数资料相对完整'
    ];
    centerEls.opsTicker.innerHTML = tickerItems
      .map((item, index) => `<span><b>${index === 0 ? '周期' : index === 1 ? '平台' : index === 2 ? '节点' : '资料'}</b><em>${escapeHtml(item)}</em></span>`)
      .join('');
  }
  if (centerEls.opsSummaryChips) {
    centerEls.opsSummaryChips.innerHTML = [
      ['周报达人', `${centerNumber(current.creators)} 位`],
      ['周报视频', `${centerNumber(current.videos)} 条`],
      ['7天节点', `${centerNumber(lifecycle.sevenDayDue)} 条`],
      ['待停追踪', `${centerNumber(lifecycle.stopTracking)} 条`]
    ]
      .map(([label, value]) => `<span><b>${escapeHtml(value)}</b><em>${escapeHtml(label)}</em></span>`)
      .join('');
  }

  if (!centerEls.opsActionList) return;
  const actions = [];
  if (quality.missingFollowers) actions.push({ level: 'high', title: `补 ${quality.missingFollowers} 位达人粉丝数`, note: '否则分层榜单和声量指数会失真' });
  if (lifecycle.sevenDayDue) actions.push({ level: 'high', title: `更新 ${lifecycle.sevenDayDue} 条 7 天表现`, note: '用于判断首波内容是否达标' });
  if (lifecycle.thirtyDayDue) actions.push({ level: 'mid', title: `复核 ${lifecycle.thirtyDayDue} 条 30 天表现`, note: '到 30 天后可停止追踪' });
  if (lifecycle.stopTracking) actions.push({ level: 'mid', title: `停止追踪 ${lifecycle.stopTracking} 条老视频`, note: '减少后续刷新和抓取成本' });
  if (quality.zeroViewVideos) actions.push({ level: 'mid', title: `检查 ${quality.zeroViewVideos} 条 0 播放记录`, note: '可能是缺少快照或平台字段异常' });
  if (!actions.length) actions.push({ level: 'ok', title: '周报周期数据状态稳定', note: '可以重点看分层榜单和复投候选' });
  centerEls.opsActionList.innerHTML = actions
    .slice(0, 3)
    .map((action) => `<li class="${action.level}"><strong>${escapeHtml(action.title)}</strong><span>${escapeHtml(action.note)}</span></li>`)
    .join('');
}

function renderOpsMonitor() {
  const quality = getQualityIssues();
  const lifecycle = getLifecycleStats();
  const creatorStats = getCreatorVideoStats('week');
  const followerByCreator = getFollowerByCreator();
  const currentCreatorKeys = new Set(creatorStats.map((creator) => creatorKey(creator.creator)));
  const noPostCreators = getScopedInfluencerRows()
    .filter((fields) => {
      const creator = creatorKey(readLocalText(fields['红人名称']));
      if (!creator) return false;
      const monitored = readLocalText(fields['是否监控']);
      return monitored !== '否' && !currentCreatorKeys.has(creator);
    })
    .slice(0, 4);
  const lowPerformers = creatorStats
    .filter((creator) => creator.videos > 0 && creator.avgViews < 5000)
    .sort((a, b) => a.avgViews - b.avgViews)
    .slice(0, 3);
  const missingFollowerCreators = getScopedInfluencerRows()
    .filter((fields) => {
      const creator = creatorKey(readLocalText(fields['红人名称']));
      return creator && !followerByCreator.get(creator);
    })
    .slice(0, 3);

  if (centerEls.followupPoolGrid) {
    const rows = [
      ...noPostCreators.map((fields) => ({
        tag: '未发',
        title: readLocalText(fields['红人名称']) || '-',
        note: `${platformLabel(readLocalText(fields['平台']))} · 周报周期未登记视频`
      })),
      ...lowPerformers.map((creator) => ({
        tag: '低效',
        title: creator.creator,
        note: `${creator.videos} 条 · 均播 ${centerNumber(creator.avgViews)}`
      })),
      ...missingFollowerCreators.map((fields) => ({
        tag: '缺粉',
        title: readLocalText(fields['红人名称']) || '-',
        note: '缺少粉丝数，影响分层判断'
      }))
    ].slice(0, 6);
    centerEls.followupPoolGrid.innerHTML = rows.length
      ? rows.map((row) => `<div class="monitor-item"><span>${escapeHtml(row.tag)}</span><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.note)}</small></div>`).join('')
      : '<div class="empty-cell">暂无紧急跟进对象</div>';
  }

  if (centerEls.lifecycleGrid) {
    const rows = [
      ['上线 0-7 天', lifecycle.firstSevenDays, '看首波表现'],
      ['7 天应更新', lifecycle.sevenDayDue, '补一次表现快照'],
      ['8-30 天追踪', lifecycle.thirtyDayTracking, '观察长尾表现'],
      ['30 天应复核', lifecycle.thirtyDayDue, '准备停止追踪'],
      ['超过 30 天', lifecycle.stopTracking, '建议停追省钱'],
      ['缺发布时间', lifecycle.missingTime, '需补时间']
    ];
    centerEls.lifecycleGrid.innerHTML = rows
      .map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><strong>${centerNumber(value)}</strong><small>${escapeHtml(note)}</small></article>`)
      .join('');
  }

  if (centerEls.qualityGrid) {
    const rows = [
      ['缺粉丝数', quality.missingFollowers, quality.totalInfluencers],
      ['缺发布时间', quality.missingVideoTime, quality.totalVideos],
      ['0 播放记录', quality.zeroViewVideos, quality.totalVideos],
      ['疑似重复视频', quality.duplicateVideos, quality.totalVideos]
    ];
    centerEls.qualityGrid.innerHTML = rows
      .map(([label, value, total]) => {
        const percent = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
        return `<article>
          <div><strong>${escapeHtml(label)}</strong><span>${centerNumber(value)}</span></div>
          <i><b style="width:${Math.max(4, percent)}%"></b></i>
          <small>${percent}% 影响范围</small>
        </article>`;
      })
      .join('');
  }
}

function latestDateFromRows(rows = [], keys = []) {
  let latest = null;
  for (const row of rows || []) {
    const fields = row.fields || row;
    for (const key of keys) {
      const date = parseDateValue(fields[key]);
      if (date && (!latest || date > latest)) latest = date;
    }
  }
  return latest;
}

function freshnessLabel(date) {
  if (!date) return '暂无';
  const age = daysSince(date);
  if (age === null) return '-';
  if (age < 0) return dateOnlyLabel(date);
  if (age === 0) return '今天';
  if (age === 1) return '1天前';
  return `${age}天前`;
}

function percentOf(value, total) {
  return total ? Math.round((rawNumber(value) / Math.max(1, rawNumber(total))) * 100) : 0;
}

function getDataHealthStats() {
  const runs = centerStore.runs || [];
  const snapshots = centerStore.snapshots || [];
  const scopedVideos = getScopedVideoRows(centerPeriod);
  const scopedInfluencers = getScopedInfluencerRows();
  const quality = getQualityIssues();
  const latestRun = latestDateFromRows(runs, ['finishedAt', 'createdAt', 'time']);
  const latestSnapshot = latestDateFromRows(snapshots, ['capturedAt', 'createdAt', 'time']);
  const generatedAt = parseDateValue(centerDashboard.generatedAt);
  const runRows = runs.map((row) => row.fields || row);
  const successfulRuns = runRows.filter((fields) => readLocalText(fields.status) === 'success').length;
  const failedRuns = runRows.filter((fields) => readLocalText(fields.status) && readLocalText(fields.status) !== 'success').length;
  const usageUsd = runRows.reduce((sum, fields) => sum + rawNumber(fields.usageUsd), 0);
  const recentRuns = runRows
    .map((fields) => ({ fields, date: parseDateValue(fields.finishedAt || fields.createdAt || fields.time) }))
    .filter((row) => row.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, 20)
    .map((row) => row.fields);
  const recentScraped = recentRuns.reduce((sum, fields) => sum + rawNumber(fields.scraped), 0);
  const recentCreated = recentRuns.reduce((sum, fields) => sum + rawNumber(fields.videoCreated), 0);
  const recentSnapshots = recentRuns.reduce((sum, fields) => sum + rawNumber(fields.snapshotCreated), 0);
  const milestoneMap = getMilestone7dByPostKey();
  const coveredVideos = scopedVideos.filter((fields) => milestoneMap.has(videoPostKey(fields))).length;
  const coverage = percentOf(coveredVideos, scopedVideos.length);
  const platformBuckets = new Map();
  for (const fields of scopedVideos) {
    const platform = platformLabel(readLocalText(fields['平台']));
    if (!platformBuckets.has(platform)) platformBuckets.set(platform, { platform, videos: 0, covered: 0 });
    const bucket = platformBuckets.get(platform);
    bucket.videos += 1;
    if (milestoneMap.has(videoPostKey(fields))) bucket.covered += 1;
  }
  const platformNeeds = [...platformBuckets.values()]
    .map((row) => ({ ...row, coverage: percentOf(row.covered, row.videos) }))
    .sort((a, b) => a.coverage - b.coverage || b.videos - a.videos);
  const lowestPlatform = platformNeeds[0] || null;
  const totalVideoCreators = new Set(getScopedVideoRows('total').map((fields) => creatorKey(readLocalText(fields['红人名称']))).filter(Boolean));
  const monitoredInfluencers = scopedInfluencers.filter((fields) => readLocalText(fields['是否监控']) !== '否');
  const notPosted = monitoredInfluencers.filter((fields) => {
    const creator = creatorKey(readLocalText(fields['红人名称']));
    return creator && !totalVideoCreators.has(creator);
  }).length;
  const priorityP1 = monitoredInfluencers.filter((fields) => readLocalText(fields['追踪优先级']).includes('P1')).length;
  return {
    runs: runRows.length,
    successfulRuns,
    failedRuns,
    successRate: percentOf(successfulRuns, runRows.length),
    usageUsd,
    recentScraped,
    recentCreated,
    recentSnapshots,
    latestRun,
    latestSnapshot,
    generatedAt,
    snapshots: snapshots.length,
    scopedVideos: scopedVideos.length,
    coveredVideos,
    coverage,
    lowestPlatform,
    notPosted,
    priorityP1,
    missingFollowers: quality.missingFollowers,
    zeroViewVideos: quality.zeroViewVideos
  };
}

function renderDataHealth() {
  if (!centerEls.dataHealthGrid) return;
  const stats = getDataHealthStats();
  const latestRunAge = daysSince(stats.latestRun);
  const freshnessLevel = !stats.latestRun ? 'danger' : latestRunAge > 2 ? 'warn' : 'good';
  const runLevel = stats.failedRuns > 0 ? 'warn' : 'good';
  const coverageLevel = stats.coverage >= 70 ? 'good' : stats.coverage >= 45 ? 'warn' : 'danger';
  const queueLevel = stats.priorityP1 || stats.notPosted ? 'warn' : 'good';
  const platformNeed = stats.lowestPlatform;
  const cards = [
    {
      level: freshnessLevel,
      label: '数据新鲜度',
      value: freshnessLabel(stats.latestRun),
      note: `最新抓取 ${centerDate(stats.latestRun)} · 看板生成 ${centerDate(stats.generatedAt)}`,
      chips: [`快照 ${freshnessLabel(stats.latestSnapshot)}`, `${centerNumber(stats.snapshots)} 条快照`]
    },
    {
      level: runLevel,
      label: '抓取稳定性',
      value: `${stats.successRate}%`,
      note: `${centerNumber(stats.successfulRuns)} 成功 / ${centerNumber(stats.failedRuns)} 失败 · Apify 约 $${stats.usageUsd.toFixed(2)}`,
      chips: [`近20次抓取 ${centerNumber(stats.recentScraped)} 条`, `新增视频 ${centerNumber(stats.recentCreated)}`, `新增快照 ${centerNumber(stats.recentSnapshots)}`]
    },
    {
      level: coverageLevel,
      label: '7日快照覆盖',
      value: `${stats.coverage}%`,
      note: `${centerNumber(stats.coveredVideos)} / ${centerNumber(stats.scopedVideos)} 条当前范围视频有 7 日快照`,
      chips: [`${selectedPeriodLabel()}`, stats.scopedVideos ? '可用于均播判断' : '当前范围无视频']
    },
    {
      level: queueLevel,
      label: '补抓优先级',
      value: platformNeed ? platformNeed.platform : `${centerNumber(stats.notPosted)} 位`,
      note: platformNeed
        ? `当前 7 日覆盖 ${platformNeed.coverage}%，${centerNumber(platformNeed.videos - platformNeed.covered)} 条待补快照`
        : '当前范围暂无明显平台补抓缺口',
      chips: [`P1 ${centerNumber(stats.priorityP1)} 位`, `未上线 ${centerNumber(stats.notPosted)} 位`, `缺粉 ${centerNumber(stats.missingFollowers)} 位`]
    }
  ];
  centerEls.dataHealthGrid.innerHTML = cards
    .map(
      (card) => `<article class="data-health-card ${card.level}">
        <span>${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.note)}</p>
        <div>${card.chips.map((chip) => `<em>${escapeHtml(chip)}</em>`).join('')}</div>
      </article>`
    )
    .join('');
}

function renderAnniversaryDashboard() {
  if (!centerEls.anniversarySnapshot) return;
  const data = centerAnniversary;
  if (!data) {
    centerEls.anniversarySnapshot.innerHTML = '<div class="empty-cell">暂无周年庆活动聚合数据</div>';
    return;
  }
  const summary = data.summary || {};
  const crawl = data.crawl || {};
  const platforms = Array.isArray(data.platforms) ? data.platforms : [];
  const regions = Array.isArray(data.regions) ? data.regions : [];
  const topVideos = Array.isArray(data.topVideos) ? data.topVideos : [];
  const owners = Array.isArray(data.owners) ? data.owners : [];
  const maxPlatformExposure = Math.max(...platforms.map((row) => Number(row.exposure) || 0), 1);
  const maxRegionOrders = Math.max(...regions.map((row) => Number(row.orders) || 0), 1);
  const maxVideoViews = Math.max(...topVideos.map((row) => Number(row.views) || 0), 1);
  const visibleTopVideos = topVideos.slice(0, 4);
  const kpis = [
    { label: '活动上线视频', value: `${centerNumber(summary.videoCount)} 条`, note: summary.periodLabel || '6月周年庆周期' },
    { label: '累计曝光', value: centerNumber(summary.exposure), note: '公开视频表现聚合' },
    { label: '归因订单', value: `${centerNumber(summary.orders)} 单`, note: '按活动达人匹配订单' },
    { label: '抓取成本', value: `$${Number(crawl.usageUsd || 0).toFixed(2)}`, note: `${centerNumber(crawl.targets)} 个达人平台目标` }
  ];
  const platformRows = platforms
    .map((row) => {
      const exposureWidth = Math.max(8, Math.round(((Number(row.exposure) || 0) / maxPlatformExposure) * 100));
      return `<article class="anniversary-platform-row platform-${platformClass(row.platform)}">
        <div>
          <strong>${escapeHtml(row.platform)}</strong>
          <span>${centerNumber(row.videoCount)} 条视频 · ${centerNumber(row.exposure)} 曝光</span>
        </div>
        <div class="anniversary-meter"><i style="width:${exposureWidth}%"></i></div>
        <dl>
          <div><dt>订单</dt><dd>${centerNumber(row.orders)}</dd></div>
          <div><dt>曝光占比</dt><dd>${centerNumber(row.exposureShare)}%</dd></div>
          <div><dt>订单占比</dt><dd>${centerNumber(row.orderShare)}%</dd></div>
        </dl>
      </article>`;
    })
    .join('');
  const regionRows = regions
    .map((row) => {
      const orderWidth = Math.max(8, Math.round(((Number(row.orders) || 0) / maxRegionOrders) * 100));
      return `<article class="anniversary-region-row">
        <strong>${escapeHtml(row.region || '-')}</strong>
        <div class="anniversary-meter"><i style="width:${orderWidth}%"></i></div>
        <span>${centerNumber(row.orders)} 单 · ${centerNumber(row.orderShare)}%</span>
      </article>`;
    })
    .join('');
  const topVideoRows = visibleTopVideos
    .map((row, index) => {
      const width = Math.max(8, Math.round(((Number(row.views) || 0) / maxVideoViews) * 100));
      return `<li>
        <em>#${index + 1}</em>
        <div>
          <strong>${externalLink(row.url, row.creator || '-')}</strong>
          <span>${escapeHtml(row.owner || '-')} · ${escapeHtml(platformLabel(row.platform))} · ${shortDate(row.publishedAt)}</span>
          <i><b style="width:${width}%"></b></i>
        </div>
        <small>${centerNumber(row.views)}</small>
      </li>`;
    })
    .join('');
  const ownerRows = owners
    .map((row) => `<span>${escapeHtml(row.owner)}：${centerNumber(row.videos)} 条 · ${centerNumber(row.views)} 曝光</span>`)
    .join('');
  centerEls.anniversarySnapshot.innerHTML = `
    <div class="anniversary-kpi-grid">
      ${kpis
        .map(
          (card) => `<article class="anniversary-kpi-card">
            <span>${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(card.value)}</strong>
            <p>${escapeHtml(card.note)}</p>
          </article>`
        )
        .join('')}
    </div>
    <div class="anniversary-grid">
      <article class="anniversary-card">
        <div class="trend-title"><strong>抓取覆盖</strong><span>截至 ${escapeHtml(summary.sourceDate || '-')}</span></div>
        <div class="anniversary-crawl-grid">
          <div><strong>${centerNumber(crawl.success)} / ${centerNumber(crawl.targets)}</strong><span>成功目标</span></div>
          <div><strong>${centerNumber(crawl.scraped)}</strong><span>抓回内容</span></div>
          <div><strong>${centerNumber(crawl.matched)}</strong><span>命中内容</span></div>
          <div><strong>$${Number(crawl.usageUsd || 0).toFixed(2)}</strong><span>Apify 成本</span></div>
        </div>
        <p class="anniversary-note">新增写入 ${centerNumber(crawl.videoCreated)} 条，重复跳过 ${centerNumber(crawl.videoSkipped)} 条；仍有 ${centerNumber(crawl.missingHomeUrl)} 个主页链接待补。</p>
        <div class="anniversary-owner-strip">${ownerRows}</div>
      </article>
      <article class="anniversary-card">
        <div class="trend-title"><strong>平台贡献</strong><span>视频 / 曝光 / 订单</span></div>
        <div class="anniversary-platform-list">${platformRows || '<div class="empty-cell">暂无平台数据</div>'}</div>
      </article>
      <article class="anniversary-card">
        <div class="trend-title"><strong>地区订单</strong><span>按区域订单量</span></div>
        <div class="anniversary-region-list">${regionRows || '<div class="empty-cell">暂无地区订单数据</div>'}</div>
      </article>
      <article class="anniversary-card wide-anniversary-card">
        <div class="trend-title"><strong>新增爆款视频</strong><span>6月活动 Top ${visibleTopVideos.length}</span></div>
        <ol class="anniversary-video-list">${topVideoRows || '<li class="empty-rank">暂无新增视频</li>'}</ol>
      </article>
    </div>`;
}

function renderTargetingOpportunities() {
  if (!centerEls.targetingSnapshot) return;
  const data = centerTargeting;
  if (!data) {
    centerEls.targetingSnapshot.innerHTML = '<div class="empty-cell">暂无公开安全的投放机会池数据</div>';
    return;
  }
  const summary = data.summary || {};
  const opportunities = Array.isArray(data.opportunities) ? data.opportunities : [];
  const strategy = Array.isArray(data.strategy) ? data.strategy : [];
  const priorityBreakdown = Array.isArray(data.priorityBreakdown) ? data.priorityBreakdown : [];
  const maxScore = Math.max(...opportunities.map((row) => Number(row.score) || 0), 1);
  const kpis = [
    { label: '候选频道', value: centerNumber(summary.totalCandidates), note: `${centerNumber(summary.coreCandidates)} 个核心强相关` },
    { label: '已合作复投', value: centerNumber(summary.existingCoop), note: '优先单独建 placement list' },
    { label: '新增发现', value: centerNumber(summary.newDiscovery), note: '适合小预算测试' },
    { label: '待补 URL', value: centerNumber(summary.needChannelUrl), note: '投放前需要补齐频道链接' }
  ];
  const priorityRows = priorityBreakdown
    .map((row) => `<span><b>${escapeHtml(row.key)}</b><em>${centerNumber(row.count)} 个</em></span>`)
    .join('');
  const opportunityRows = opportunities
    .slice(0, 4)
    .map((row) => {
      const width = Math.max(8, Math.round(((Number(row.score) || 0) / maxScore) * 100));
      const priority = String(row.priorityKey || '待').toLowerCase();
      return `<article class="targeting-opportunity priority-${escapeHtml(priority)}">
        <div class="targeting-opportunity-head">
          <div>
            <strong>${externalLink(row.channelUrl, row.channel || '-')}</strong>
            <span>${escapeHtml(row.priority || '待分组')} · ${escapeHtml(row.scale || '待复核')} · ${escapeHtml(row.followers || '待补充')}</span>
          </div>
          <em>${centerNumber(row.score)}</em>
        </div>
        <div class="targeting-score"><i style="width:${width}%"></i></div>
        <p title="${escapeHtml(row.recommendedUse || '')}">${escapeHtml(shortText(row.recommendedUse || '先复核近30天内容，再决定是否加入投放名单。', 58))}</p>
        <small title="${escapeHtml(row.risk || '')}">${escapeHtml(shortText(row.risk || '投放前复核内容风险', 52))} · ${escapeHtml(row.product || '待匹配产品')}</small>
      </article>`;
    })
    .join('');
  const strategyRows = strategy
    .slice(0, 2)
    .map((row) => `<article class="targeting-strategy-card">
      <span>${escapeHtml(row.module || '策略')}</span>
      <strong title="${escapeHtml(row.suggestion || '')}">${escapeHtml(shortText(row.suggestion || '-', 64))}</strong>
      <p title="${escapeHtml(row.execution || '')}">${escapeHtml(shortText(row.execution || '', 66))}</p>
    </article>`)
    .join('');
  const topReference = opportunities[0];
  centerEls.targetingSnapshot.innerHTML = `
    <div class="targeting-kpi-grid">
      ${kpis
        .map(
          (card) => `<article class="targeting-kpi-card">
            <span>${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(card.value)}</strong>
            <p>${escapeHtml(card.note)}</p>
          </article>`
        )
        .join('')}
    </div>
    <div class="targeting-layout">
      <article class="targeting-card targeting-main-card">
        <div class="trend-title"><strong>优先频道候选</strong><span>Top 4 · 按优先级和评分排序</span></div>
        <div class="targeting-opportunity-list">${opportunityRows || '<div class="empty-cell">暂无频道候选</div>'}</div>
      </article>
      <article class="targeting-card">
        <div class="trend-title"><strong>投放策略</strong><span>来自本机研究聚合</span></div>
        <div class="targeting-priority-strip">${priorityRows}</div>
        ${topReference ? `<div class="targeting-reference">
          <span>参考爆点</span>
          <strong>${externalLink(topReference.refVideoUrl, topReference.refTitle || topReference.channel || '-')}</strong>
          <p>${escapeHtml(topReference.channel || '-')} · ${escapeHtml(topReference.refViews || '-')}</p>
        </div>` : ''}
        <div class="targeting-strategy-list">${strategyRows || '<div class="empty-cell">暂无策略摘要</div>'}</div>
      </article>
    </div>`;
}

function renderPlatformMatrix() {
  if (!centerEls.platformMatrix) return;
  const rows = getPlatformStats(centerPeriod);
  if (!rows.length) {
    centerEls.platformMatrix.innerHTML = '<div class="empty-cell">暂无平台表现数据</div>';
    return;
  }
  const maxViews = Math.max(...rows.map((row) => row.views), 1);
  centerEls.platformMatrix.innerHTML = rows
    .map((row, index) => {
      const width = Math.max(8, Math.round((row.views / maxViews) * 100));
      const topCreator = externalLink(row.topUrl, row.topCreator);
      return `<article class="platform-row platform-${platformClass(row.platform)}" style="--delay:${index * 80}ms">
        <div class="platform-head">
          <strong>${escapeHtml(row.platform)}</strong>
          <span>${centerNumber(row.videos)} 条视频</span>
        </div>
        <div class="platform-bar"><i style="width:${width}%"></i></div>
        <dl>
          <div><dt>${escapeHtml(dashboardVoiceLabel())}</dt><dd>${centerNumber(row.views)}</dd></div>
          <div><dt>${escapeHtml(dashboardAverageLabel())}</dt><dd>${centerNumber(row.avgViews)}</dd></div>
          <div><dt>最强达人</dt><dd>${topCreator}</dd></div>
          <div><dt>成熟覆盖</dt><dd>${centerNumber(row.mature7dVideos)}/${centerNumber(row.videos)}</dd></div>
        </dl>
      </article>`;
    })
    .join('');
}

async function ensureWorldGeo() {
  if (!window.echarts) return null;
  if (worldGeoReady) return worldGeoReady;
  worldGeoReady = fetch(assetUrl('data/world.json'), { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) throw new Error('world geojson unavailable');
      return response.json();
    })
    .then((geoJson) => {
      window.echarts.registerMap('worldYozma', geoJson);
      return geoJson;
    })
    .catch(() => null);
  return worldGeoReady;
}

async function ensureUsaGeo() {
  if (!window.echarts) return null;
  if (usaGeoReady) return usaGeoReady;
  usaGeoReady = fetch(assetUrl('data/usa.json'), { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) throw new Error('usa geojson unavailable');
      return response.json();
    })
    .then((geoJson) => {
      window.echarts.registerMap('usaYozma', geoJson);
      return geoJson;
    })
    .catch(() => null);
  return usaGeoReady;
}

async function ensureCanadaGeo() {
  if (!window.echarts) return null;
  if (canadaGeoReady) return canadaGeoReady;
  canadaGeoReady = fetch(assetUrl('data/canada.json'), { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) throw new Error('canada geojson unavailable');
      return response.json();
    })
    .then((geoJson) => {
      window.echarts.registerMap('canadaYozma', geoJson);
      return geoJson;
    })
    .catch(() => null);
  return canadaGeoReady;
}

async function ensureEuropeGeo() {
  if (!window.echarts) return null;
  if (europeGeoReady) return europeGeoReady;
  europeGeoReady = fetch(assetUrl('data/europe.json'), { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) throw new Error('europe geojson unavailable');
      return response.json();
    })
    .then((geoJson) => {
      window.echarts.registerMap('europeYozma', geoJson);
      return geoJson;
    })
    .catch(() => null);
  return europeGeoReady;
}

function ensureDrillGeo(mode) {
  if (mode === 'us') return ensureUsaGeo();
  if (mode === 'ca') return ensureCanadaGeo();
  if (mode === 'eu') return ensureEuropeGeo();
  return ensureWorldGeo();
}

function mapThemeForRow(row = {}) {
  const country = row.mapCountry || row.country || '';
  const region = row.region || row.country || '';
  if (country === 'United States' || region === 'US') return MAP_REGION_THEMES.US;
  if (country === 'Canada' || region === 'CA') return MAP_REGION_THEMES.CA;
  if (country === 'United Kingdom' || region === 'UK') return MAP_REGION_THEMES.UK;
  if (country === 'Europe' || region === 'EU' || EUROPE_MAP_COUNTRIES.has(country)) return MAP_REGION_THEMES.EU;
  return MAP_REGION_THEMES.OTHER;
}

function stableMapIndex(value, length) {
  if (!length) return 0;
  const text = String(value || 'yozma-eu').trim() || 'yozma-eu';
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash % length;
}

function estimatedEuropeCountryForRow(row = {}, fallbackCountries = EUROPE_WORLD_FALLBACK_COUNTRIES) {
  const basis = row.creatorName || row.videoUrl || row.id || row.videoTitle || row.publishDate || '';
  const candidates = fallbackCountries.length ? fallbackCountries : EUROPE_WORLD_FALLBACK_COUNTRIES;
  return candidates[stableMapIndex(basis, candidates.length)];
}

function worldMapCountryForRow(row = {}, europeFallbackCountries = EUROPE_WORLD_FALLBACK_COUNTRIES) {
  const normalizedCountry = normalizeMapCountryName(row.mapCountry || row.country || row.region);
  if (['Unknown', 'UNKNOWN', '未标注地区'].includes(normalizedCountry)) {
    return {
      mapCountry: '',
      region: '未标注地区',
      isEstimated: false
    };
  }
  if (normalizedCountry === 'Europe') {
    return {
      mapCountry: estimatedEuropeCountryForRow(row, europeFallbackCountries),
      region: 'EU',
      isEstimated: true
    };
  }
  return {
    mapCountry: normalizedCountry,
    region: normalizeCountryRegion(normalizedCountry),
    isEstimated: false
  };
}

function mapPaletteForMode(mode) {
  return MAP_DRILL_CONFIG[mode]?.palette || ['#172235', '#1E5A78', '#33D6C5', '#FFB454', '#E63946'];
}

function mapVideoHeatColor(videos, maxVideos) {
  const rawRatio = maxVideos ? Math.min(1, Math.max(0, videos / maxVideos)) : 0;
  const ratio = Math.sqrt(rawRatio);
  return MAP_VIDEO_HEAT_STOPS.find((stop) => ratio >= stop.threshold)?.color || MAP_VIDEO_HEAT_STOPS.at(-1).color;
}

const MAP_SHORT_LABELS = {
  'United States': 'US',
  Canada: 'CA',
  'United Kingdom': 'UK',
  Germany: 'DE',
  France: 'FR',
  Italy: 'IT',
  Spain: 'ES',
  Netherlands: 'NL',
  Sweden: 'SE',
  Poland: 'PL',
  Belgium: 'BE',
  Austria: 'AT',
  Australia: 'AU',
  Mexico: 'MX'
};

function mapShortLabel(name) {
  return MAP_SHORT_LABELS[name] || String(name || '').replace('Czech Republic', 'Czechia');
}

function shouldShowMapLabel(row, maxVideos, isDrillMode) {
  if (!row?.videos || row.isUnassigned) return false;
  if (!isDrillMode && EUROPE_MAP_COUNTRIES.has(row.mapCountry) && row.mapCountry !== 'United Kingdom') {
    return row.videos >= Math.max(2, Math.ceil(maxVideos * 0.01));
  }
  const ratioThreshold = isDrillMode ? 0.08 : 0.03;
  const absoluteThreshold = isDrillMode ? 1 : 2;
  return row.videos >= Math.max(absoluteThreshold, Math.ceil(maxVideos * ratioThreshold));
}

function mapFeatureName(row, isDrillMode) {
  const name = isDrillMode ? row.mapDataName || row.placeLabel : row.mapCountry;
  return isDrillMode ? name : WORLD_MAP_FEATURE_ALIASES[name] || name;
}

function mapSeriesItem(row, maxVideos, isDrillMode) {
  const name = mapFeatureName(row, isDrillMode);
  if (!name || row.isUnassigned || name === 'Europe' || name === 'Unknown') return null;
  const areaColor = mapVideoHeatColor(row.videos, maxVideos);
  return {
    name,
    value: row.videos,
    row,
    itemStyle: {
      areaColor,
      borderColor: 'rgba(255, 235, 235, 0.68)',
      borderWidth: row.videos === maxVideos ? 1.25 : 0.9,
      shadowBlur: row.videos === maxVideos ? 16 : 7,
      shadowColor: row.videos === maxVideos ? 'rgba(230, 57, 70, 0.42)' : 'rgba(230, 57, 70, 0.2)'
    },
    emphasis: {
      itemStyle: {
        areaColor: '#FF5964',
        borderColor: '#FFD1D4',
        borderWidth: 1.4,
        shadowBlur: 18,
        shadowColor: 'rgba(255, 89, 100, 0.48)'
      }
    }
  };
}

function exactEuropeCountriesForRows(rows = []) {
  const exactCountries = [];
  const seen = new Set();
  for (const row of rows) {
    const normalizedCountry = normalizeMapCountryName(row.mapCountry || row.country || row.region);
    if (normalizedCountry === 'Europe' || normalizedCountry === 'Unknown') continue;
    if (!EUROPE_MAP_COUNTRIES.has(normalizedCountry)) continue;
    if (seen.has(normalizedCountry)) continue;
    seen.add(normalizedCountry);
    exactCountries.push(normalizedCountry);
  }
  return exactCountries;
}

function getCountryStats(period = centerPeriod) {
  const cacheKey = `country|${period}|${currentFilterKey()}`;
  if (geoStatsCache.has(cacheKey)) return geoStatsCache.get(cacheKey);
  const rows = normalizeData(getScopedVideoRows(period));
  const europeFallbackCountries = exactEuropeCountriesForRows(rows);
  const map = new Map();
  for (const row of rows) {
    const worldCountry = worldMapCountryForRow(row, europeFallbackCountries);
    const key = worldCountry.mapCountry || 'Unknown';
    if (!worldCountry.mapCountry) continue;
    if (!map.has(key)) {
      map.set(key, {
        placeKey: key,
        placeLabel: key,
        country: key,
        region: worldCountry.region || row.region,
        mapCountry: key,
        videos: 0,
        estimatedVideos: 0,
        exactVideos: 0,
        views: 0,
        creators: new Set(),
        estimatedCreators: new Set(),
        topCreator: '-',
        topVideo: null,
        lat: REGION_LOCATION_FALLBACKS[worldCountry.region]?.lat || REGION_LOCATION_FALLBACKS[row.region]?.lat || REGION_LOCATION_FALLBACKS[row.country]?.lat || null,
        lng: REGION_LOCATION_FALLBACKS[worldCountry.region]?.lng || REGION_LOCATION_FALLBACKS[row.region]?.lng || REGION_LOCATION_FALLBACKS[row.country]?.lng || null
      });
    }
    const stat = map.get(key);
    stat.videos += 1;
    if (worldCountry.isEstimated) {
      stat.estimatedVideos += 1;
      if (row.creatorName) stat.estimatedCreators.add(row.creatorName);
    } else {
      stat.exactVideos += 1;
    }
    stat.views += row.views;
    if (row.creatorName) stat.creators.add(row.creatorName);
    if (!stat.topVideo || row.views > stat.topVideo.views) {
      stat.topVideo = row;
      stat.topCreator = row.creatorName;
    }
  }
  const result = [...map.values()]
    .map((row) => ({
      ...row,
      creatorsCount: row.creators.size,
      estimatedCreatorsCount: row.estimatedCreators.size,
      avgViews: row.videos ? Math.round(row.views / row.videos) : 0
    }))
    .sort((a, b) => b.videos - a.videos || b.views - a.views);
  geoStatsCache.set(cacheKey, result);
  return result;
}

function getUsStateStats(period = centerPeriod) {
  const cacheKey = `us-state|${period}|${currentFilterKey()}`;
  if (geoStatsCache.has(cacheKey)) return geoStatsCache.get(cacheKey);
  const regionByCreator = getRegionByCreator();
  const locationByCreator = getLocationByCreator();
  const ownerByCreator = getOwnerByCreator();
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const location = getVideoLocation(fields, locationByCreator, regionByCreator);
    const normalized = normalizeVideoRow(fields, { regionByCreator, locationByCreator, ownerByCreator });
    if (normalized.mapCountry !== 'United States' && location.country !== 'US') continue;
    const stateCode = String(location.state || '').toUpperCase();
    const stateName = US_STATE_NAMES[stateCode] || (location.placeLabel || '').replace(/, US$/, '') || 'Unknown State';
    const key = stateName;
    if (!map.has(key)) {
      map.set(key, {
        placeKey: `US-${stateCode || key}`,
        placeLabel: stateName,
        country: 'US',
        state: stateCode,
        region: 'US',
        mapCountry: 'United States',
        videos: 0,
        views: 0,
        creators: new Set(),
        topCreator: '-',
        topVideo: null
      });
    }
    const stat = map.get(key);
    stat.videos += 1;
    stat.views += normalized.views;
    if (normalized.creatorName) stat.creators.add(normalized.creatorName);
    if (!stat.topVideo || normalized.views > stat.topVideo.views) {
      stat.topVideo = normalized;
      stat.topCreator = normalized.creatorName;
    }
  }
  const result = [...map.values()]
    .map((row) => ({
      ...row,
      creatorsCount: row.creators.size,
      avgViews: row.videos ? Math.round(row.views / row.videos) : 0
    }))
    .sort((a, b) => b.videos - a.videos || b.views - a.views);
  geoStatsCache.set(cacheKey, result);
  return result;
}

function normalizeCanadaProvinceName(state, placeLabel = '') {
  const raw = String(state || '').trim();
  const label = String(placeLabel || '').replace(/,\s*(CA|Canada)$/i, '').trim();
  const value = raw || (label && label !== 'Canada' ? label : '');
  if (!value) return '';
  const upper = value.toUpperCase();
  if (CA_PROVINCE_NAMES[upper]) return CA_PROVINCE_NAMES[upper];
  if (CA_PROVINCE_ALIASES[upper]) return CA_PROVINCE_ALIASES[upper];
  const matched = Object.values(CA_PROVINCE_NAMES).find((name) => name.toUpperCase() === upper || name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === upper);
  return matched || value;
}

function canadaProvinceCode(provinceName) {
  const normalized = String(provinceName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return Object.entries(CA_PROVINCE_NAMES).find(([, name]) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === normalized)?.[0] || '';
}

function getCanadaProvinceStats(period = centerPeriod) {
  const cacheKey = `ca-province|${period}|${currentFilterKey()}`;
  if (geoStatsCache.has(cacheKey)) return geoStatsCache.get(cacheKey);
  const regionByCreator = getRegionByCreator();
  const locationByCreator = getLocationByCreator();
  const ownerByCreator = getOwnerByCreator();
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const location = getVideoLocation(fields, locationByCreator, regionByCreator);
    const normalized = normalizeVideoRow(fields, { regionByCreator, locationByCreator, ownerByCreator });
    if (normalized.mapCountry !== 'Canada' && location.country !== 'CA') continue;
    const provinceName = normalizeCanadaProvinceName(location.state, location.placeLabel);
    const provinceCode = canadaProvinceCode(provinceName);
    const isUnassigned = !provinceName;
    const key = isUnassigned ? 'Canada 未分省' : provinceName;
    if (!map.has(key)) {
      map.set(key, {
        placeKey: isUnassigned ? 'CA-UNASSIGNED' : `CA-${provinceCode || provinceName}`,
        placeLabel: key,
        country: 'CA',
        state: provinceCode,
        region: 'CA',
        mapCountry: 'Canada',
        mapDataName: isUnassigned ? '' : provinceName,
        isUnassigned,
        videos: 0,
        views: 0,
        creators: new Set(),
        topCreator: '-',
        topVideo: null
      });
    }
    const stat = map.get(key);
    stat.videos += 1;
    stat.views += normalized.views;
    if (normalized.creatorName) stat.creators.add(normalized.creatorName);
    if (!stat.topVideo || normalized.views > stat.topVideo.views) {
      stat.topVideo = normalized;
      stat.topCreator = normalized.creatorName;
    }
  }
  const result = [...map.values()]
    .map((row) => ({
      ...row,
      creatorsCount: row.creators.size,
      avgViews: row.videos ? Math.round(row.views / row.videos) : 0
    }))
    .sort((a, b) => b.videos - a.videos || b.views - a.views);
  geoStatsCache.set(cacheKey, result);
  return result;
}

function getEuropeCountryStats(period = centerPeriod) {
  const cacheKey = `eu-country|${period}|${currentFilterKey()}`;
  if (geoStatsCache.has(cacheKey)) return geoStatsCache.get(cacheKey);
  const regionByCreator = getRegionByCreator();
  const locationByCreator = getLocationByCreator();
  const ownerByCreator = getOwnerByCreator();
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const location = getVideoLocation(fields, locationByCreator, regionByCreator);
    const normalized = normalizeVideoRow(fields, { regionByCreator, locationByCreator, ownerByCreator });
    if (!isEuropeGroupRow(normalized) && !isEuropeGroupRow(location)) continue;
    const countryName = normalizeMapCountryName(location.country || normalized.country || normalized.mapCountry);
    const canDrawCountry = countryName !== 'Europe' && EUROPE_MAP_COUNTRIES.has(countryName);
    const key = canDrawCountry ? countryName : 'Europe 未细分';
    if (!map.has(key)) {
      map.set(key, {
        placeKey: canDrawCountry ? `EU-${countryName}` : 'EU-UNASSIGNED',
        placeLabel: key,
        country: canDrawCountry ? (location.country || normalized.country) : 'EU',
        state: '',
        region: countryName === 'United Kingdom' ? 'UK' : 'EU',
        mapCountry: canDrawCountry ? countryName : 'Europe',
        mapDataName: canDrawCountry ? countryName : '',
        isUnassigned: !canDrawCountry,
        videos: 0,
        views: 0,
        creators: new Set(),
        topCreator: '-',
        topVideo: null
      });
    }
    const stat = map.get(key);
    stat.videos += 1;
    stat.views += normalized.views;
    if (normalized.creatorName) stat.creators.add(normalized.creatorName);
    if (!stat.topVideo || normalized.views > stat.topVideo.views) {
      stat.topVideo = normalized;
      stat.topCreator = normalized.creatorName;
    }
  }
  const result = [...map.values()]
    .map((row) => ({
      ...row,
      creatorsCount: row.creators.size,
      avgViews: row.videos ? Math.round(row.views / row.videos) : 0
    }))
    .sort((a, b) => b.videos - a.videos || b.views - a.views);
  geoStatsCache.set(cacheKey, result);
  return result;
}

function getMapRowsForMode(period = centerPeriod) {
  if (mapDrillMode === 'us') return getUsStateStats(period);
  if (mapDrillMode === 'ca') return getCanadaProvinceStats(period);
  if (mapDrillMode === 'eu') return getEuropeCountryStats(period);
  return getCountryStats(period);
}

function renderGlobalMap() {
  if (!centerEls.globalMapCanvas || !centerEls.globalMapDetail || !centerEls.globalRegionBars) return;
  const drillConfig = MAP_DRILL_CONFIG[mapDrillMode] || null;
  const isDrillMode = Boolean(drillConfig);
  let rows = getMapRowsForMode(centerPeriod);
  if (isDrillMode && !rows.length) {
    rows = [{
      placeKey: `${drillConfig.countryCode}-EMPTY`,
      placeLabel: `${drillConfig.countryName} 暂无${drillConfig.unitLabel}视频数据`,
      country: drillConfig.countryCode,
      state: '',
      region: drillConfig.countryCode,
      mapCountry: drillConfig.countryName,
      mapDataName: '',
      isUnassigned: true,
      videos: 0,
      views: 0,
      creatorsCount: 0,
      avgViews: 0,
      topCreator: '-',
      topVideo: null
    }];
  }
  if (centerEls.globalMapScopeLabel) centerEls.globalMapScopeLabel.textContent = isDrillMode ? `${selectedPeriodLabel()} · ${drillConfig.scopeLabel}` : `${selectedPeriodLabel()} · 世界`;
  if (centerEls.btnResetMapFilter) centerEls.btnResetMapFilter.textContent = isDrillMode ? '返回世界地图' : '重置地图筛选';
  if (!rows.length) {
    centerEls.globalMapCanvas.innerHTML = '<div class="empty-cell">当前时间范围暂无可定位的视频数据</div>';
    centerEls.globalMapDetail.innerHTML = '<div class="empty-cell">暂无区域详情</div>';
    centerEls.globalRegionBars.innerHTML = '<div class="empty-cell">暂无地区上线数据</div>';
    return;
  }

  if (!selectedMapPlaceKey || !rows.some((row) => row.placeKey === selectedMapPlaceKey)) {
    selectedMapPlaceKey = rows[0].placeKey;
  }
  const active = rows.find((row) => row.placeKey === selectedMapPlaceKey) || rows[0];
  const maxVideos = Math.max(...rows.map((row) => row.videos), 1);
  const mapWidth = centerEls.globalMapCanvas.clientWidth || centerEls.globalMapCanvas.offsetWidth || 0;
  const showMapLabels = mapWidth >= 430;
  const geoPromise = isDrillMode ? ensureDrillGeo(mapDrillMode) : ensureWorldGeo();
  Promise.resolve(geoPromise).then((geoJson) => {
    if (!geoJson || !window.echarts) {
      centerEls.globalMapCanvas.innerHTML = '<div class="empty-cell">地图资源加载失败，已保留右侧地区排行作为兜底。</div>';
      return;
    }
    worldMapChart = getChartInstance(centerEls.globalMapCanvas, worldMapChart);
    if (!worldMapChart) return;
    const mapName = isDrillMode ? drillConfig.mapName : 'worldYozma';
    const chartData = rows.map((row) => mapSeriesItem(row, maxVideos, isDrillMode)).filter(Boolean);
    worldMapChart.off('click');
    worldMapChart.on('click', (params) => {
      const clicked = rows.find((row) => mapFeatureName(row, isDrillMode) === params.name || row.placeLabel === params.name);
      if (!clicked && !isDrillMode && MAP_COUNTRY_TO_DRILL_MODE[params.name]) {
        enterMapDrill(MAP_COUNTRY_TO_DRILL_MODE[params.name], params.name);
        return;
      }
      if (!clicked) return;
      selectedMapPlaceKey = clicked.placeKey;
      if (!isDrillMode && MAP_COUNTRY_TO_DRILL_MODE[clicked.mapCountry]) {
        enterMapDrill(MAP_COUNTRY_TO_DRILL_MODE[clicked.mapCountry], clicked.mapCountry);
        return;
      } else if (!isDrillMode) {
        dashboardFilters.country = clicked.mapCountry;
      }
      renderGlobalMap();
      scheduleMapDependentRender();
    });
    const zr = worldMapChart.getZr?.();
    if (zr) {
      if (worldMapChart.__yozmaBlankClickHandler) {
        zr.off('click', worldMapChart.__yozmaBlankClickHandler);
      }
      worldMapChart.__yozmaBlankClickHandler = (event) => {
        if (event.target || !MAP_DRILL_CONFIG[mapDrillMode]) return;
        resetMapToWorld();
      };
      zr.on('click', worldMapChart.__yozmaBlankClickHandler);
    }
    worldMapChart.setOption({
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#121C2B',
        borderColor: 'rgba(255,255,255,.12)',
        textStyle: { color: '#F7F8FA' },
        formatter: (params) => {
          const row = params.data?.row || rows.find((item) => mapFeatureName(item, isDrillMode) === params.name || item.mapCountry === params.name) || {};
          if (!row.videos) return `${params.name}<br/>暂无视频数据`;
          const top = row.topVideo || {};
          const estimatedLine = !isDrillMode && row.estimatedVideos
            ? `<br/>EU 未细分兜底：${centerNumber(row.estimatedVideos)} 条`
            : '';
          return `<strong>${row.placeLabel}</strong><br/>上线视频：${centerNumber(row.videos)} 条${estimatedLine}<br/>${escapeHtml(dashboardVoiceLabel())}：${centerNumber(row.views)}<br/>参与达人：${centerNumber(row.creatorsCount)} 位<br/>${escapeHtml(dashboardAverageLabel())}：${centerNumber(row.avgViews)}<br/>爆款达人：${escapeHtml(row.topCreator || '-')}<br/>爆款视频：${escapeHtml(top.videoTitle || top.creatorName || '-')}`;
        }
      },
      visualMap: {
        show: true,
        min: 0,
        max: maxVideos,
        left: 14,
        bottom: 14,
        orient: 'horizontal',
        itemWidth: 128,
        itemHeight: 8,
        itemGap: 8,
        text: ['上线多', '上线少'],
        textStyle: {
          color: 'rgba(248, 250, 252, 0.78)',
          fontSize: 10,
          fontWeight: 800
        },
        backgroundColor: 'rgba(8, 14, 24, 0.72)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: [7, 9],
        borderRadius: 999,
        formatter: (value) => centerNumber(Math.round(value)),
        inRange: {
          color: ['#FF9BA2', '#F56F78', '#E64655', '#CF2438', '#B4142B', '#8F0F22']
        },
        outOfRange: {
          color: '#121B2B'
        }
      },
      series: [
        {
          name: '视频上线数',
          type: 'map',
          map: mapName,
          roam: false,
          zoom: isDrillMode ? drillConfig.zoom : 1.06,
          selectedMode: false,
          label: {
            show: showMapLabels,
            color: '#FFF3F4',
            fontSize: isDrillMode ? 9 : 10,
            fontWeight: 900,
            lineHeight: 12,
            textBorderColor: 'rgba(7, 12, 20, 0.86)',
            textBorderWidth: 3,
            formatter: (params) => {
              const row = params.data?.row;
              if (!shouldShowMapLabel(row, maxVideos, isDrillMode)) return '';
              return `${mapShortLabel(params.name)}\n${centerNumber(row.videos)}`;
            }
          },
          labelLayout: {
            hideOverlap: true
          },
          itemStyle: {
            areaColor: '#121B2B',
            borderColor: 'rgba(255,255,255,.1)',
            borderWidth: 0.5
          },
          emphasis: {
            itemStyle: { areaColor: '#FF5964' },
            label: { show: false }
          },
          z: 3,
          data: chartData
        }
      ]
    }, true);
  });

  const top = active.topVideo || {};
  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const totalVideos = rows.reduce((sum, row) => sum + row.videos, 0);
  const actionNote = !active.videos
      ? '当前没有可拆到下一级区域的视频数据；后续补充国家或省份字段后，这里会自动上色和排行。'
      : !isDrillMode && active.estimatedVideos
      ? `其中 ${centerNumber(active.estimatedVideos)} 条来自 EU 大区未细分数据，先用欧洲国家色块做热力兜底；补齐国家字段后会自动回到真实国家。`
      : active.isUnassigned
      ? '这部分视频只有大区信息，暂时无法落到具体国家或省份；补齐地址字段后会自动进入地图色块。'
      : active.avgViews >= Math.round(totalViews / Math.max(totalVideos, 1))
      ? '该地区均播高于当前整体均值，适合优先复盘爆款内容和达人类型。'
      : '该地区有上线贡献，但均播一般，建议看具体平台和达人分层后再判断是否加码。';
  const drillMode = !isDrillMode ? MAP_COUNTRY_TO_DRILL_MODE[active.mapCountry] : '';
  const drillButton = drillMode
    ? `<button class="map-drill-button" data-map-place="${escapeHtml(active.placeKey)}">${escapeHtml(MAP_DRILL_CONFIG[drillMode].drillLabel)}</button>`
    : '';
  const detailTheme = mapThemeForRow(active);
  centerEls.globalMapDetail.innerHTML = `<article class="map-detail-hero region-${escapeHtml(detailTheme.key)}">
    <span>${escapeHtml(active.region || '国家 / 区域')}</span>
    <strong>${escapeHtml(active.placeLabel)}</strong>
    <p>${isDrillMode ? escapeHtml(drillConfig.activeCopy) : '点击 United States / Canada / Europe / UK 可进入二级地图；颜色按上线视频数量深浅变化，点击海洋空白可返回世界地图。'}</p>
    ${drillButton}
  </article>
  <dl class="map-detail-metrics">
    <div><dt>上线视频</dt><dd>${centerNumber(active.videos)} 条</dd></div>
    <div><dt>参与达人</dt><dd>${centerNumber(active.creatorsCount)} 位</dd></div>
    <div><dt>${escapeHtml(dashboardVoiceLabel())}</dt><dd>${centerNumber(active.views)}</dd></div>
    <div><dt>${escapeHtml(dashboardAverageLabel())}</dt><dd>${centerNumber(active.avgViews)}</dd></div>
  </dl>
  <div class="map-detail-top">
    <span>区域爆款</span>
    <strong>${externalLink(top.videoUrl, top.creatorName || active.topCreator || '-')}</strong>
    <small>${escapeHtml(top.platform || '-')} · ${shortDate(top.publishDate)} · ${centerNumber(top.views || 0)} ${escapeHtml(dashboardVoiceLabel())}</small>
    <p>${escapeHtml(actionNote)}</p>
  </div>`;

  centerEls.globalRegionBars.innerHTML = rows
    .slice(0, 12)
    .map((row) => {
      const width = Math.max(6, Math.round((row.videos / maxVideos) * 100));
      const activeClass = row.placeKey === active.placeKey ? ' active' : '';
      const theme = mapThemeForRow(row);
      const precision = isDrillMode
        ? drillConfig.unitLabel
        : row.estimatedVideos
        ? `${row.region || '国家'} · 含 ${centerNumber(row.estimatedVideos)} 条EU兜底`
        : row.region || '国家';
      return `<button class="geo-bar-row region-${escapeHtml(theme.key)}${activeClass}" data-map-place="${escapeHtml(row.placeKey)}">
        <span>${escapeHtml(row.placeLabel)}<small>${escapeHtml(precision)} · ${centerNumber(row.videos)} 条 · ${centerNumber(row.creatorsCount)} 位</small></span>
        <i><b style="width:${width}%"></b></i>
        <strong>${centerNumber(row.videos)} 条</strong>
        <em>声量 ${centerNumber(row.views)}</em>
      </button>`;
    })
    .join('');
}

function getRegionStats(period = centerPeriod) {
  const regionByCreator = getRegionByCreator();
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const region = getVideoRegion(fields, regionByCreator);
    const creator = readLocalText(fields['红人名称']) || '-';
    const creatorId = creatorKey(creator);
    const views = dashboardVoiceViews(fields);
    const row = {
      creator,
      platform: platformLabel(readLocalText(fields['平台'])),
      postUrl: videoUrl(fields),
      publishedAt: fields.timestamp,
      views
    };
    if (!map.has(region)) {
      map.set(region, {
        region,
        videos: 0,
        views: 0,
        creators: new Set(),
        topVideo: null,
        videosList: []
      });
    }
    const stats = map.get(region);
    stats.videos += 1;
    stats.views += views;
    if (creatorId) stats.creators.add(creatorId);
    stats.videosList.push(row);
    if (!stats.topVideo || views > stats.topVideo.views) stats.topVideo = row;
  }
  const totalViews = [...map.values()].reduce((sum, row) => sum + row.views, 0);
  return [...map.values()]
    .map((row) => ({
      ...row,
      creatorsCount: row.creators.size,
      avgViews: row.videos ? Math.round(row.views / row.videos) : 0,
      share: totalViews ? Math.round((row.views / totalViews) * 100) : 0,
      videosList: row.videosList.sort((a, b) => b.views - a.views)
    }))
    .sort((a, b) => b.views - a.views || b.videos - a.videos);
}

function getGeoStats(period = centerPeriod) {
  const locationByCreator = getLocationByCreator();
  const regionByCreator = getRegionByCreator();
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const location = getVideoLocation(fields, locationByCreator, regionByCreator);
    if (!location) continue;
    const placeKey = location.placeKey || location.country || 'UNKNOWN';
    const creator = readLocalText(fields['红人名称']) || '-';
    const creatorId = creatorKey(creator);
    const views = dashboardVoiceViews(fields);
    const row = {
      creator,
      platform: platformLabel(readLocalText(fields['平台'])),
      postUrl: videoUrl(fields),
      publishedAt: fields.timestamp,
      views
    };
    if (!map.has(placeKey)) {
      map.set(placeKey, {
        placeKey,
        placeLabel: location.placeLabel || placeKey,
        country: location.country || '',
        state: location.state || '',
        precision: location.precision || 'country',
        lat: Number(location.lat),
        lng: Number(location.lng),
        videos: 0,
        views: 0,
        creators: new Set(),
        topVideo: null,
        videosList: []
      });
    }
    const stats = map.get(placeKey);
    stats.videos += 1;
    stats.views += views;
    if (creatorId) stats.creators.add(creatorId);
    stats.videosList.push(row);
    if (!stats.topVideo || views > stats.topVideo.views) stats.topVideo = row;
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      creatorsCount: row.creators.size,
      avgViews: row.videos ? Math.round(row.views / row.videos) : 0,
      videosList: row.videosList.sort((a, b) => b.views - a.views)
    }))
    .sort((a, b) => b.views - a.views || b.videos - a.videos);
}

function getOwnerStats(period = centerPeriod) {
  const ownerByCreator = getOwnerByCreator();
  const regionByCreator = getRegionByCreator();
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const owner = getVideoOwner(fields, ownerByCreator);
    const region = getVideoRegion(fields, regionByCreator);
    const creator = readLocalText(fields['红人名称']) || '-';
    const creatorId = creatorKey(creator);
    const views = dashboardVoiceViews(fields);
    const likes = rawNumber(fields.likesCount);
    const comments = rawNumber(fields.commentsCount);
    const row = {
      owner,
      region,
      creator,
      platform: platformLabel(readLocalText(fields['平台'])),
      publishedAt: fields.timestamp,
      postUrl: videoUrl(fields),
      views,
      likes,
      comments,
      engagementRate: views ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0,
      caption: readLocalText(fields.caption)
    };
    if (!map.has(owner)) {
      map.set(owner, {
        owner,
        videos: 0,
        views: 0,
        creators: new Set(),
        regions: new Set(),
        topVideo: null,
        videosList: []
      });
    }
    const stats = map.get(owner);
    stats.videos += 1;
    stats.views += views;
    if (creatorId) stats.creators.add(creatorId);
    if (region) stats.regions.add(region);
    stats.videosList.push(row);
    if (!stats.topVideo || views > stats.topVideo.views) stats.topVideo = row;
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      creatorsCount: row.creators.size,
      regionList: [...row.regions].filter(Boolean).join(' / ') || '-',
      avgViews: row.videos ? Math.round(row.views / row.videos) : 0,
      videosList: row.videosList.sort((a, b) => b.views - a.views)
    }))
    .sort((a, b) => b.views - a.views || b.videos - a.videos);
}

function renderRegionPerformance() {
  if (!centerEls.regionSummaryGrid || !centerEls.regionLeaderboardGrid) return;
  const rows = getRegionStats(centerPeriod);
  const missing = rows.find((row) => row.region === '未标注地区');
  const visibleRows = rows.filter((row) => row.region !== '未标注地区');
  if (centerEls.regionMissingNotice) {
    if (missing && missing.videos) {
      centerEls.regionMissingNotice.innerHTML = `当前时间范围有 <strong>${centerNumber(missing.videos)}</strong> 条视频缺少地区归因。请在红人库补充“地区/国家/市场”字段，地区看板会自动变准。`;
    } else {
      centerEls.regionMissingNotice.textContent = '地区字段已可用于当前时间范围的归因统计。';
    }
  }
  if (!visibleRows.length) {
    centerEls.regionSummaryGrid.innerHTML = '<div class="empty-cell">当前时间暂无地区播放数据</div>';
    centerEls.regionLeaderboardGrid.innerHTML = '<div class="empty-cell">当前时间暂无地区榜单</div>';
    return;
  }
  const maxViews = Math.max(...visibleRows.map((row) => row.views), 1);
  centerEls.regionSummaryGrid.innerHTML = visibleRows
    .map((row, index) => {
      const width = Math.max(6, Math.round((row.views / maxViews) * 100));
      const top = row.topVideo;
      const topLabel = externalLink(top?.postUrl, top?.creator || '-');
      return `<article class="region-card" style="--delay:${index * 70}ms">
        <div class="region-card-head"><strong>${escapeHtml(row.region)}</strong><span>${row.share}% ${escapeHtml(dashboardVoiceLabel())}占比</span></div>
        <div class="region-meter"><i style="width:${width}%"></i></div>
        <dl>
          <div><dt>${escapeHtml(dashboardVoiceLabel())}</dt><dd>${centerNumber(row.views)}</dd></div>
          <div><dt>视频</dt><dd>${centerNumber(row.videos)} 条</dd></div>
          <div><dt>达人</dt><dd>${centerNumber(row.creatorsCount)} 位</dd></div>
          <div><dt>均播</dt><dd>${centerNumber(row.avgViews)}</dd></div>
        </dl>
        <p>爆款：${topLabel} · ${centerNumber(top?.views || 0)}</p>
      </article>`;
    })
    .join('');

  centerEls.regionLeaderboardGrid.innerHTML = visibleRows
    .map((region) => {
      const list = region.videosList.slice(0, 3);
      const items = list.length
        ? list
            .map((row, index) => {
              const title = externalLink(row.postUrl, row.creator || row.postUrl || '-');
              return `<li>
                <span>${index + 1}</span>
                <div><strong>${title}</strong><small>${escapeHtml(row.platform)} · ${shortDate(row.publishedAt)}</small></div>
                <b>${centerNumber(row.views)}</b>
              </li>`;
            })
            .join('')
        : '<li class="empty-rank">暂无视频</li>';
      return `<article class="region-board-card">
        <div class="tier-board-title">
          <div><strong>${escapeHtml(region.region)}</strong><span>${centerNumber(region.views)} ${escapeHtml(dashboardVoiceLabel())} · ${centerNumber(region.videos)} 条视频</span></div>
          <em>Top ${Math.min(3, list.length)}</em>
        </div>
        <ol class="rank-list">${items}</ol>
      </article>`;
    })
    .join('');
}

function renderOwnerPerformance() {
  if (!centerEls.ownerSummaryGrid || !centerEls.ownerVideoGrid) return;
  const rows = getOwnerStats(centerPeriod);
  const missing = rows.find((row) => row.owner === '未标注负责人');
  const visibleRows = rows.filter((row) => row.owner !== '未标注负责人');
  if (centerEls.ownerMissingNotice) {
    if (missing && missing.videos) {
      centerEls.ownerMissingNotice.innerHTML = `当前时间范围有 <strong>${centerNumber(missing.videos)}</strong> 条视频缺少负责人归因，已从负责人排行中单独剔除。补充负责人字段后会自动归入对应负责人。`;
      centerEls.ownerMissingNotice.style.display = '';
    } else {
      centerEls.ownerMissingNotice.textContent = '负责人字段已可用于当前时间范围的归因统计。';
      centerEls.ownerMissingNotice.style.display = '';
    }
  }
  if (!visibleRows.length) {
    centerEls.ownerSummaryGrid.innerHTML = '<div class="empty-cell">当前时间暂无负责人上线数据</div>';
    centerEls.ownerVideoGrid.innerHTML = '<div class="empty-cell">当前时间暂无视频明细</div>';
    return;
  }
  const maxViews = Math.max(...visibleRows.map((row) => row.views), 1);
  centerEls.ownerSummaryGrid.innerHTML = visibleRows
    .map((row, index) => {
      const width = Math.max(6, Math.round((row.views / maxViews) * 100));
      const top = row.topVideo;
      const topLabel = externalLink(top?.postUrl, top?.creator || '-');
      return `<article class="owner-card" style="--delay:${index * 70}ms">
        <div class="owner-card-head"><strong>${escapeHtml(row.owner)}</strong><span>${escapeHtml(row.regionList)}</span></div>
        <div class="owner-meter"><i style="width:${width}%"></i></div>
        <dl>
          <div><dt>上线达人</dt><dd>${centerNumber(row.creatorsCount)} 位</dd></div>
          <div><dt>上线视频</dt><dd>${centerNumber(row.videos)} 条</dd></div>
          <div><dt>${escapeHtml(dashboardVoiceLabel())}</dt><dd>${centerNumber(row.views)}</dd></div>
          <div><dt>均播</dt><dd>${centerNumber(row.avgViews)}</dd></div>
        </dl>
        <p>爆款：${topLabel} · ${centerNumber(top?.views || 0)}</p>
      </article>`;
    })
    .join('');

  centerEls.ownerVideoGrid.innerHTML = visibleRows
    .map((owner) => {
      const list = owner.videosList.slice(0, 3);
      const items = list.length
        ? list
            .map((row, index) => {
              const title = externalLink(row.postUrl, row.creator || row.postUrl || '-');
              return `<li>
                <span>${index + 1}</span>
                <div><strong>${title}</strong><small>${escapeHtml(row.region)} · ${escapeHtml(row.platform)} · ${shortDate(row.publishedAt)} · 互动率 ${row.engagementRate}%</small></div>
                <b>${centerNumber(row.views)}</b>
              </li>`;
            })
            .join('')
        : '<li class="empty-rank">暂无上线视频</li>';
      return `<article class="owner-board-card">
        <div class="tier-board-title">
          <div><strong>${escapeHtml(owner.owner)}</strong><span>${centerNumber(owner.creatorsCount)} 位达人 · ${centerNumber(owner.videos)} 条视频 · ${centerNumber(owner.views)} ${escapeHtml(dashboardVoiceLabel())}</span></div>
          <em>Top ${Math.min(3, list.length)}</em>
        </div>
        <ol class="rank-list">${items}</ol>
      </article>`;
    })
    .join('');
}

function renderLeaderboards() {
  const creators = getCreatorVideoStats(centerPeriod).sort((a, b) => b.views - a.views || b.videos - a.videos);
  centerEls.creatorLeaderboard.innerHTML = creators.length
    ? creators
        .slice(0, 8)
        .map(
          (row, index) =>
            `<li><span>${index + 1}</span><div><strong>${escapeHtml(row.creator || '-')}</strong><small>${centerNumber(row.views)} ${escapeHtml(dashboardVoiceLabel())} · ${centerNumber(row.videos)} 条视频</small></div><b>${centerNumber(row.avgViews)}</b></li>`
        )
        .join('')
    : '<li class="empty-rank">暂无达人榜单</li>';

  const videos = getScopedVideoLeaderboard(centerPeriod);
  centerEls.videoLeaderboard.innerHTML = videos.length
    ? videos
        .slice(0, 8)
        .map((row) => {
          const title = externalLink(row.postUrl, row.creator || row.postUrl || '-');
          return `<li><span>${row.rank || '-'}</span><div><strong>${title}</strong><small>${escapeHtml(row.platform || '-')} · ${shortDate(row.publishedAt)} · 互动率 ${row.engagementRate || 0}%</small></div><b>${centerNumber(row.views)}</b></li>`;
        })
        .join('')
    : '<li class="empty-rank">暂无视频榜单</li>';
}

function fillSelect(select, values, defaultLabel) {
  if (!select) return;
  const current = select.value || 'all';
  const uniqueValues = [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
  select.innerHTML = `<option value="all">${escapeHtml(defaultLabel)}</option>${uniqueValues
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join('')}`;
  select.value = uniqueValues.includes(current) ? current : 'all';
}

let activeCustomSelect = null;

function filterSelects() {
  return [centerEls.platformFilter, centerEls.regionFilter, centerEls.ownerFilter].filter(Boolean);
}

function customSelectLabel(select) {
  return select.options[select.selectedIndex]?.textContent || select.options[0]?.textContent || '全部';
}

function closeCustomSelect() {
  if (!activeCustomSelect) return;
  activeCustomSelect.trigger.classList.remove('is-open');
  activeCustomSelect.menu.remove();
  activeCustomSelect = null;
}

function positionCustomSelectMenu(state) {
  const rect = state.trigger.getBoundingClientRect();
  const width = Math.max(rect.width, 168);
  const left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
  const top = Math.min(rect.bottom + 6, window.innerHeight - 48);
  state.menu.style.width = `${width}px`;
  state.menu.style.left = `${left}px`;
  state.menu.style.top = `${top}px`;
}

function openCustomSelect(select) {
  const state = select._customSelect;
  if (!state) return;
  if (activeCustomSelect?.select === select) {
    closeCustomSelect();
    return;
  }
  closeCustomSelect();
  const menu = document.createElement('div');
  menu.className = 'custom-select-menu';
  menu.setAttribute('role', 'listbox');
  [...select.options].forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `custom-select-option${option.value === select.value ? ' is-active' : ''}`;
    button.textContent = option.textContent;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', option.value === select.value ? 'true' : 'false');
    button.addEventListener('click', () => {
      select.value = option.value;
      syncCustomFilterSelects();
      select.dispatchEvent(new Event('change', { bubbles: true }));
      closeCustomSelect();
    });
    menu.appendChild(button);
  });
  document.body.appendChild(menu);
  activeCustomSelect = { ...state, menu };
  state.trigger.classList.add('is-open');
  positionCustomSelectMenu(activeCustomSelect);
}

function syncCustomFilterSelects() {
  filterSelects().forEach((select) => {
    const label = select.closest('label');
    if (!label) return;
    label.classList.add('custom-select-ready');
    if (!select._customSelect) {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger';
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCustomSelect(select);
      });
      select.insertAdjacentElement('afterend', trigger);
      select._customSelect = { select, trigger };
    }
    select._customSelect.trigger.textContent = customSelectLabel(select);
  });
  if (activeCustomSelect) positionCustomSelectMenu(activeCustomSelect);
}

function populateDashboardFilters() {
  const helpers = {
    regionByCreator: getRegionByCreator(),
    ownerByCreator: getOwnerByCreator(),
    locationByCreator: getLocationByCreator()
  };
  const rows = (centerStore.videos || []).map((row) => normalizeVideoRow(row.fields || row, helpers));
  fillSelect(centerEls.platformFilter, rows.map((row) => row.platform), '全部平台');
  fillSelect(centerEls.regionFilter, rows.map((row) => row.region), '全部区域');
  fillSelect(centerEls.ownerFilter, rows.map((row) => row.owner), '全部负责人');
  syncCustomFilterSelects();
}

function populateVideoFilters() {
  const helpers = getDashboardHelpers();
  const rows = (centerStore.videos || []).map((row, index) => normalizeVideoRow(fieldsWithRecordId(row, index, 'local_video'), helpers));
  fillSelect(centerEls.videoFilterPlatform, rows.map((row) => row.platform), '全部平台');
  fillSelect(centerEls.videoFilterOwner, rows.map((row) => row.owner), '全部负责人');
}

function moneyBreakdownText(value) {
  const data = value && typeof value === 'object' ? value : {};
  const order = ['USD', 'CAD', 'EUR', 'GBP', 'UNKNOWN'];
  const keys = [...new Set([...order, ...Object.keys(data)])].filter((key) => rawNumber(data[key]) > 0);
  if (!keys.length) return '待导入';
  return keys.map((key) => `${key} ${centerNumber(data[key])}`).join(' / ');
}

function mergeMoneyBreakdown(rows, key) {
  const output = {};
  for (const row of rows) {
    const data = row[key] && typeof row[key] === 'object' ? row[key] : {};
    for (const [currency, amount] of Object.entries(data)) {
      output[currency] = (output[currency] || 0) + rawNumber(amount);
    }
  }
  return output;
}

function hasMoneyBreakdown(value) {
  return Object.values(value && typeof value === 'object' ? value : {}).some((amount) => rawNumber(amount) > 0);
}

function getAffiliateSalesAnalysis(period = centerPeriod) {
  const videoStatsByCreator = new Map(getCreatorVideoStats(period).map((row) => [creatorKey(row.creator), row]));
  return (centerStore.affiliateSales || [])
    .map((row) => {
      const fields = row.fields || row;
      const creator = readLocalText(fields.creatorName) || readLocalText(fields.affiliateName) || '-';
      const key = creatorKey(creator);
      const videoStats = videoStatsByCreator.get(key) || {};
      const orders = fields.orders === null || fields.orders === undefined || fields.orders === '' ? null : rawNumber(fields.orders);
      const revenue = fields.revenue === null || fields.revenue === undefined || fields.revenue === '' ? null : rawNumber(fields.revenue);
      const commission = fields.commission === null || fields.commission === undefined || fields.commission === '' ? null : rawNumber(fields.commission);
      const revenueByCurrency = fields.revenueByCurrency && typeof fields.revenueByCurrency === 'object' ? fields.revenueByCurrency : {};
      const commissionByCurrency = fields.commissionByCurrency && typeof fields.commissionByCurrency === 'object' ? fields.commissionByCurrency : {};
      const hasOrderMetrics =
        Boolean(fields.hasOrderMetrics) ||
        rawNumber(orders) > 0 ||
        rawNumber(revenue) > 0 ||
        rawNumber(commission) > 0 ||
        hasMoneyBreakdown(revenueByCurrency) ||
        hasMoneyBreakdown(commissionByCurrency);
      const owner = readLocalText(fields.owner) || videoStats.owner || '-';
      const region = readLocalText(fields.region) || readLocalText(fields.market) || videoStats.region || '-';
      return {
        affiliateName: readLocalText(fields.affiliateName),
        creator,
        creatorCode: readLocalText(fields.creatorCode),
        email: readLocalText(fields.email),
        owner,
        region,
        market: readLocalText(fields.market),
        referralCode: readLocalText(fields.referralCode) || readLocalText(fields.marketingAffiliateCode),
        referralLink: readLocalText(fields.referralLink),
        status: readLocalText(fields.status) || '-',
        matchStatus: readLocalText(fields.matchStatus),
        matchCount: rawNumber(fields.matchCount),
        hasOrderMetrics,
        orders,
        revenue,
        commission,
        revenueByCurrency,
        commissionByCurrency,
        videos: rawNumber(videoStats.videos),
        views: rawNumber(videoStats.views),
        avgViews: rawNumber(videoStats.avgViews),
        topUrl: videoStats.topUrl || readLocalText(fields.firstPostUrl),
        cooperationProgress: readLocalText(fields.cooperationProgress),
        metricsNotice: readLocalText(fields.metricsNotice)
      };
    })
    .filter((row) => {
      if (dashboardFilters.owner !== 'all' && row.owner !== dashboardFilters.owner) return false;
      if (dashboardFilters.region !== 'all' && row.region !== dashboardFilters.region) return false;
      return true;
    })
    .sort((a, b) => rawNumber(b.orders) - rawNumber(a.orders) || b.views - a.views || a.creator.localeCompare(b.creator, 'zh-CN'));
}

function renderAffiliateSalesDashboard() {
  if (!centerEls.affiliateSalesKpis || !centerEls.affiliateSalesCorrelation) return;
  const rows = getAffiliateSalesAnalysis(centerPeriod);
  const matched = rows.filter((row) => row.matchStatus === 'email_matched').length;
  const withOrders = rows.filter((row) => row.hasOrderMetrics).length;
  const activeRows = rows.filter((row) => row.views > 0 || row.videos > 0);
  const totalViews = activeRows.reduce((sum, row) => sum + row.views, 0);
  const totalOrders = rows.reduce((sum, row) => sum + rawNumber(row.orders), 0);
  const revenueByCurrency = mergeMoneyBreakdown(rows, 'revenueByCurrency');
  const commissionByCurrency = mergeMoneyBreakdown(rows, 'commissionByCurrency');

  if (centerEls.affiliateSalesNotice) {
    centerEls.affiliateSalesNotice.innerHTML = withOrders
      ? `已识别 <strong>${centerNumber(withOrders)}</strong> 条带订单指标的记录，可以按当前周期对比视频声量与出单。`
      : `当前导入的 affiliate CSV 是联盟账号资料，暂未包含订单数、销售额、佣金字段；已完成 email 匹配，先用于查看哪些联盟达人有视频声量。`;
  }

  centerEls.affiliateSalesKpis.innerHTML = [
    ['联盟账号', `${centerNumber(rows.length)} 条`, '四个 CSV 合并去重'],
    ['Email 匹配', `${centerNumber(matched)} 条`, `${centerNumber(rows.length - matched)} 条未匹配`],
    ['有声量达人', `${centerNumber(activeRows.length)} 条`, `${centerNumber(totalViews)} ${dashboardVoiceLabel()}`],
    ['Approved 订单', withOrders ? `${centerNumber(totalOrders)} 单` : '未导入', withOrders ? `GMV ${moneyBreakdownText(revenueByCurrency)}` : '需订单/佣金报表'],
    ['佣金', hasMoneyBreakdown(commissionByCurrency) ? moneyBreakdownText(commissionByCurrency) : '未导入', '按原币种分开统计，不做汇率混算']
  ]
    .map(
      ([label, value, note]) => `<article class="affiliate-kpi-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(note)}</small>
      </article>`
    )
    .join('');

  const topRows = rows.filter((row) => row.matchStatus === 'email_matched' || row.hasOrderMetrics).slice(0, 10);
  const maxScore = Math.max(...topRows.map((row) => rawNumber(row.orders) * 100000 + row.views), 1);
  centerEls.affiliateSalesCorrelation.innerHTML = topRows.length
    ? topRows
        .map((row) => {
          const score = rawNumber(row.orders) * 100000 + row.views;
          const width = Math.max(4, Math.round((score / maxScore) * 100));
          const creator = externalLink(row.topUrl, row.creator);
          const orderText = row.hasOrderMetrics ? `${centerNumber(row.orders)} 单 · GMV ${moneyBreakdownText(row.revenueByCurrency)}` : '本期订单 0';
          return `<article class="affiliate-correlation-row">
            <div>
              <strong>${creator}</strong>
              <span>${escapeHtml(row.owner)} · ${escapeHtml(row.region)} · ${escapeHtml(row.referralCode || '-')}</span>
            </div>
            <div class="affiliate-bar"><i style="width:${width}%"></i></div>
            <b>${centerNumber(row.views)} 声量</b>
            <em>${escapeHtml(orderText)}</em>
          </article>`;
        })
        .join('')
    : '<div class="empty-cell">暂无可匹配的联盟达人。</div>';
}

function influencerDeliverableKey(fields) {
  return creatorLooseKey(readLocalText(fields['红人编码'])) || creatorLooseKey(readLocalText(fields['红人名称'])) || readLocalLink(fields['红人链接']);
}

function uniqueDeliverableInfluencers() {
  const rows = new Map();
  getScopedInfluencerRows().forEach((fields) => {
    const expected = rawNumber(fields['预计视频交付']);
    const status = readLocalText(fields['合同交付解析状态']);
    const service = readLocalText(fields['合作服务']);
    if (!expected && !status) return;
    const key = influencerDeliverableKey(fields);
    if (!key) return;
    const current = rows.get(key);
    const candidate = {
      fields,
      creator: readLocalText(fields['红人名称']) || '-',
      owner: readLocalText(fields['负责人']) || '未标注负责人',
      region: readRegionField(fields) || '未标注地区',
      expected,
      completed: rawNumber(fields['已上线视频']),
      remaining: rawNumber(fields['待补视频交付']),
      parseStatus: status || '待补充',
      service: service || readLocalText(fields['合作模式']) || '待补充',
      split: readLocalText(fields['合同交付平台拆分']),
      progress: expected ? Math.min(100, Math.round((rawNumber(fields['已上线视频']) / expected) * 100)) : 0
    };
    if (!current || candidate.expected > current.expected || candidate.completed > current.completed) rows.set(key, candidate);
  });
  return [...rows.values()];
}

function renderDeliverableDashboard() {
  if (!centerEls.deliverableKpis || !centerEls.deliverableGapList) return;
  const rows = uniqueDeliverableInfluencers();
  const expected = rows.reduce((sum, row) => sum + row.expected, 0);
  const completed = rows.reduce((sum, row) => sum + row.completed, 0);
  const remaining = Math.max(0, expected - completed);
  const pending = rows.filter((row) => row.parseStatus === '待人工确认' || !row.expected).length;
  const rate = expected ? Math.round((completed / expected) * 100) : 0;
  centerEls.deliverableKpis.innerHTML = [
    ['交付达人', `${centerNumber(rows.length)} 位`, '已匹配营销/合同字段'],
    ['预计视频', `${centerNumber(expected)} 条`, `已上线 ${centerNumber(completed)} 条`],
    ['完成率', `${rate}%`, `待补 ${centerNumber(remaining)} 条`],
    ['待确认合同', `${centerNumber(pending)} 项`, '需要人工确认交付数量']
  ]
    .map(([label, value, note]) => `<article class="deliverable-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`)
    .join('');

  const gapRows = rows
    .filter((row) => row.parseStatus === '待人工确认' || row.remaining > 0 || !row.expected)
    .sort((a, b) => b.remaining - a.remaining || b.expected - a.expected)
    .slice(0, 3);
  centerEls.deliverableGapList.innerHTML = gapRows.length
    ? gapRows
        .map((row, index) => `<li>
          <span>${index + 1}</span>
          <div>
            <strong>${escapeHtml(row.creator)}</strong>
            <small>${escapeHtml(row.owner)} · ${escapeHtml(row.region)} · ${escapeHtml(row.service)} · ${escapeHtml(row.split || row.parseStatus)}</small>
          </div>
          <b>${row.expected ? `${centerNumber(row.completed)}/${centerNumber(row.expected)}` : '待确认'}</b>
        </li>`)
        .join('')
    : '<li class="empty-rank">当前筛选下没有待补交付。</li>';
}

function renderDashboardCharts() {
  renderCommandKpis();
  renderFocusBrief();
  renderDeliverableDashboard();
  renderLineChart(centerEls.weeklyTrendChart, getWeeklyTrendRows());
  renderBarChart(centerEls.monthlyBarChart, getMonthlyTrendRows());
  renderOpsCommandCenter();
  renderDataHealth();
  renderTargetingOpportunities();
  renderGlobalMap();
  renderOpsMonitor();
  renderPlatformMatrix();
  renderRegionPerformance();
  renderOwnerPerformance();
  renderAffiliateSalesDashboard();
  renderLeaderboards();
}

function renderTierCards(tiers) {
  centerEls.tierGrid.innerHTML = '';
  (tiers || []).forEach((tier) => {
    const card = document.createElement('article');
    card.className = `tier-card${tier.creators ? ' active' : ''}`;
    card.innerHTML = `<h4>${tier.label}</h4><span>${tier.range}</span>
      <dl>
        <dt>达人数量</dt><dd>${tier.creators || 0} 位</dd>
        <dt>上线视频</dt><dd>${tier.videos || 0} 条</dd>
        <dt>${escapeHtml(dashboardVoiceLabel())}</dt><dd>${centerNumber(tier.views)}</dd>
        <dt>${escapeHtml(dashboardAverageLabel())}</dt><dd>${centerNumber(tier.avgViews)}</dd>
        <dt>最佳达人</dt><dd>${tier.topCreator || '-'}</dd>
      </dl>`;
    centerEls.tierGrid.appendChild(card);
  });
}

function getTierLeaderboards(period) {
  const followerByCreator = getFollowerByCreator();
  const byTier = new Map(tierOrder().map((tier) => [tier.key, { ...tier, creators: new Map() }]));
  for (const fields of getScopedVideoRows(period)) {
    const creatorName = readLocalText(fields['红人名称']) || '-';
    const key = creatorKey(creatorName);
    if (!key) continue;
    const followers = followerByCreator.get(key) || 0;
    const tier = getInfluencerTier(followers);
    if (!byTier.has(tier.key)) continue;
    const bucket = byTier.get(tier.key);
    if (!bucket.creators.has(key)) {
      bucket.creators.set(key, {
        creator: creatorName,
        followers,
        videos: 0,
        views: 0,
        topUrl: '',
        topViews: 0
      });
    }
    const stats = bucket.creators.get(key);
    const views = dashboardVoiceViews(fields);
    stats.videos += 1;
    stats.views += views;
    if (views >= stats.topViews) {
      stats.topViews = views;
      stats.topUrl = videoUrl(fields);
    }
  }
  return [...byTier.values()].map((tier) => ({
    ...tier,
    creators: [...tier.creators.values()]
      .map((creator) => ({
        ...creator,
        avgViews: creator.videos ? Math.round(creator.views / creator.videos) : 0,
        voiceIndex: creator.followers ? Number(((creator.views / creator.followers) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.views - a.views || b.avgViews - a.avgViews)
  }));
}

function getTierSummaryRows(period) {
  return getTierLeaderboards(period).map((tier) => {
    const creators = tier.creators || [];
    const videos = creators.reduce((sum, creator) => sum + creator.videos, 0);
    const views = creators.reduce((sum, creator) => sum + creator.views, 0);
    const best = creators[0] || {};
    return {
      key: tier.key,
      label: tier.label,
      range: tier.range,
      creators: creators.length,
      videos,
      views,
      avgViews: videos ? Math.round(views / videos) : 0,
      topCreator: best.creator || '-'
    };
  });
}

function renderTierLeaderboards() {
  if (!centerEls.tierLeaderboardGrid) return;
  const tiers = getTierLeaderboards(centerPeriod);
  centerEls.tierLeaderboardGrid.innerHTML = tiers
    .map((tier) => {
      const rows = tier.creators.slice(0, 3);
      const list = rows.length
        ? rows
            .map((row, index) => {
              const creator = externalLink(row.topUrl, row.creator);
              return `<li>
                <span>${index + 1}</span>
                <div>
                  <strong>${creator}</strong>
                  <small>${centerNumber(row.followers)} 粉丝 · ${centerNumber(row.videos)} 条 · 均播 ${centerNumber(row.avgViews)} · 指数 ${row.voiceIndex}</small>
                </div>
                <b>${centerNumber(row.views)}</b>
              </li>`;
            })
            .join('')
        : '<li class="empty-rank">当前维度暂无该分层视频</li>';
      return `<article class="tier-board-card tier-${tier.key}">
        <div class="tier-board-title">
          <div><strong>${escapeHtml(tier.label)}</strong><span>${escapeHtml(tier.range)}</span></div>
          <em>${rows.length ? `Top ${rows.length}` : '暂无'}</em>
        </div>
        <ol class="rank-list tier-rank-list">${list}</ol>
      </article>`;
    })
    .join('');
}

function renderTierBenchmarks() {
  if (!centerEls.tierBenchmarkGrid) return;
  const tiers = getTierLeaderboards(centerPeriod);
  centerEls.tierBenchmarkGrid.innerHTML = tiers
    .map((tier) => {
      const creators = tier.creators || [];
      const videos = creators.reduce((sum, creator) => sum + creator.videos, 0);
      const views = creators.reduce((sum, creator) => sum + creator.views, 0);
      const avgViews = videos ? Math.round(views / videos) : 0;
      const best = creators[0];
      const lift = best && avgViews ? Math.round((best.avgViews / avgViews) * 100) : 0;
      return `<article class="tier-benchmark-card tier-${tier.key}">
        <span>${escapeHtml(tier.label)}</span>
        <strong>${centerNumber(avgViews)}</strong>
        <small>本层均播基准 · ${escapeHtml(tier.range)}</small>
        <div class="benchmark-bar"><i style="width:${Math.min(100, Math.max(8, lift))}%"></i></div>
        <p>${best ? `${escapeHtml(best.creator)} 高于基准 ${Math.max(0, lift - 100)}%` : '当前维度暂无可比较数据'}</p>
      </article>`;
    })
    .join('');
}

function renderCurrentPeriod() {
  centerEls.tierPeriodLabel.textContent = `当前展示：${selectedPeriodLabel()}`;
  renderTierCards(getTierSummaryRows(centerPeriod));
  renderTierBenchmarks();
  renderTierLeaderboards();
}

function renderCustomSummaryCard() {
  if (!centerEls.customVideos) return;
  const summary = getScopedVideoSummary('custom');
  centerEls.customVideos.textContent = centerNumber(summary.videos);
  centerEls.customCreators.textContent = centerNumber(summary.creators);
  centerEls.customViews.textContent = centerNumber(summary.views);
  if (customRange.start && customRange.end) {
    const inclusiveEnd = new Date(new Date(customRange.end).getTime() - 24 * 60 * 60 * 1000);
    centerEls.customRangeLabel.textContent = `${dateOnlyLabel(customRange.start)} - ${dateOnlyLabel(inclusiveEnd)}`;
  } else {
    centerEls.customRangeLabel.textContent = '选择日期后查看';
  }
}

function renderPeriodSensitiveViews() {
  updateDashboardControlState();
  renderCommandKpis();
  renderFocusBrief();
  renderDeliverableDashboard();
  renderCustomSummaryCard();
  renderCurrentPeriod();
  renderDataHealth();
  renderLineChart(centerEls.weeklyTrendChart, getWeeklyTrendRows());
  renderBarChart(centerEls.monthlyBarChart, getMonthlyTrendRows());
  renderPlatformMatrix();
  renderGlobalMap();
  renderRegionPerformance();
  renderOwnerPerformance();
  renderAffiliateSalesDashboard();
  renderLeaderboards();
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadTextFile(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([`\uFEFF${text}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportScopedVideosCsv() {
  const videoFilters = getVideoTableFilters();
  const rows = normalizeData(getScopedVideoRows(centerPeriod))
    .filter((row) => videoRowPassesTableFilters(row, videoFilters))
    .map((row) => {
      const activeViews = row.views;
      const currentViews = row.currentViews;
      const mature7dViews = row.mature7dViews;
      const likes = rawNumber(row.likes);
      const comments = rawNumber(row.comments);
      return {
        负责人: row.owner,
        地区: row.region,
        红人名称: row.creatorName || '',
        平台: row.platform,
        上线时间: row.raw?.timestamp || '',
        当前声量口径: dashboardVoiceLabel(),
        当前展示声量: activeViews,
        即时播放: currentViews,
        '7日成熟声量': mature7dViews,
        点赞数: likes,
        评论数: comments,
        互动率: activeViews ? `${Number((((likes + comments) / activeViews) * 100).toFixed(2))}%` : '0%',
        视频链接: row.videoUrl,
        文案: row.videoTitle
      };
    })
    .sort((a, b) => Number(b['当前展示声量']) - Number(a['当前展示声量']));
  if (!rows.length) {
    centerEls.status.textContent = '当前时间范围没有可导出的视频数据。';
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
  const range = selectedPeriodLabel().replace(/[\\/:*?"<>|\s]+/g, '-');
  downloadTextFile(`Yozma-${range}-上线视频负责人数据.csv`, csv);
  centerEls.status.textContent = `已导出 ${rows.length} 条当前时间范围上线视频数据。`;
}

function platformCodeFromLabel(value) {
  const label = platformLabel(value);
  if (label === 'Instagram Reels') return 'instagramreels';
  if (label === 'TikTok') return 'tiktok';
  if (label === 'YouTube Shorts') return 'youtubeshort';
  if (label === 'YouTube Video') return 'youtubevideo';
  return String(value || '').trim();
}

function getVideoTableFilters() {
  return {
    search: String(centerEls.videoTableSearch?.value || '').trim().toLowerCase(),
    start: startOfInputDay(centerEls.videoFilterStart?.value || ''),
    end: exclusiveEndOfInputDay(centerEls.videoFilterEnd?.value || ''),
    platform: centerEls.videoFilterPlatform?.value || 'all',
    owner: centerEls.videoFilterOwner?.value || 'all'
  };
}

function videoRowPassesTableFilters(row, filters) {
  if (filters.search) {
    const matched = [row.creatorName, row.platform, row.owner, row.region, row.country, row.videoTitle]
      .some((value) => String(value || '').toLowerCase().includes(filters.search));
    if (!matched) return false;
  }
  if (filters.start && (!row.publishDate || row.publishDate < filters.start)) return false;
  if (filters.end && (!row.publishDate || row.publishDate >= filters.end)) return false;
  if (filters.platform !== 'all' && row.platform !== filters.platform) return false;
  if (filters.owner !== 'all' && row.owner !== filters.owner) return false;
  return true;
}

function findVideoRecord(recordId) {
  const target = String(recordId || '');
  return (centerStore.videos || []).find((row, index) => String(row.id || row.recordId || `local_video_${index + 1}`) === target);
}

function openVideoEditor(recordId) {
  if (isStaticCenter) {
    centerEls.status.textContent = '团队只读版不能直接修改数据；请回到本地中台操作。';
    return;
  }
  const record = findVideoRecord(recordId);
  if (!record) {
    centerEls.status.textContent = '没有找到这条视频记录，刷新中台后再试一次。';
    return;
  }
  const fields = fieldsWithRecordId(record, 0, 'local_video');
  const row = normalizeVideoRow(fields);
  activeVideoEditId = String(recordId || '');
  centerEls.videoEditCreator.value = row.creatorName === '-' ? '' : row.creatorName;
  centerEls.videoEditOwner.value = row.owner === '未标注负责人' ? '' : row.owner;
  centerEls.videoEditRegion.value = row.region === '未标注地区' ? '' : row.region;
  centerEls.videoEditPlatform.value = platformCodeFromLabel(readLocalText(fields['平台']) || row.platform);
  centerEls.videoEditTimestamp.value = dateTimeInputValue(row.publishDate || fields.timestamp);
  centerEls.videoEditViews.value = row.views || videoViews(fields) || '';
  centerEls.videoEditLikes.value = rawNumber(fields.likesCount) || '';
  centerEls.videoEditComments.value = rawNumber(fields.commentsCount) || '';
  centerEls.videoEditUrl.value = row.videoUrl || videoUrl(fields) || '';
  centerEls.videoEditCaption.value = row.videoTitle || '';
  if (centerEls.videoEditHint) centerEls.videoEditHint.textContent = '保存后会写回本地视频上线表。';
  centerEls.videoEditModal.hidden = false;
}

function closeVideoEditor() {
  activeVideoEditId = '';
  if (centerEls.videoEditModal) centerEls.videoEditModal.hidden = true;
}

async function saveVideoEditor() {
  if (!activeVideoEditId) return;
  const timestampInput = centerEls.videoEditTimestamp?.value || '';
  const timestamp = timestampInput ? new Date(timestampInput).toISOString() : '';
  const views = rawNumber(centerEls.videoEditViews?.value);
  const url = String(centerEls.videoEditUrl?.value || '').trim();
  const fields = {
    红人名称: String(centerEls.videoEditCreator?.value || '').trim(),
    负责人: String(centerEls.videoEditOwner?.value || '').trim(),
    地区: String(centerEls.videoEditRegion?.value || '').trim(),
    平台: platformCodeFromLabel(centerEls.videoEditPlatform?.value || ''),
    timestamp,
    mature7dViews: views,
    videoPlayCount: views,
    videoViewCount: views,
    likesCount: rawNumber(centerEls.videoEditLikes?.value),
    commentsCount: rawNumber(centerEls.videoEditComments?.value),
    url,
    videoUrl: url,
    caption: String(centerEls.videoEditCaption?.value || '').trim()
  };
  centerEls.btnSaveVideoEditor.disabled = true;
  if (centerEls.videoEditHint) centerEls.videoEditHint.textContent = '正在保存...';
  try {
    await centerRequest(`/api/local/videos/${encodeURIComponent(activeVideoEditId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    closeVideoEditor();
    await loadCenter();
    centerEls.status.textContent = '视频记录已更新。';
  } catch (error) {
    if (centerEls.videoEditHint) centerEls.videoEditHint.textContent = error.message;
    centerEls.status.textContent = error.message;
  } finally {
    centerEls.btnSaveVideoEditor.disabled = false;
  }
}

async function deleteVideoRecord(recordId) {
  if (isStaticCenter) {
    centerEls.status.textContent = '团队只读版不能删除数据；请回到本地中台操作。';
    return;
  }
  const record = findVideoRecord(recordId);
  const fields = record?.fields || record || {};
  const creator = readLocalText(fields['红人名称']) || '这条视频';
  if (!window.confirm(`确定删除「${creator}」这条视频记录吗？删除后不会出现在中台明细里。`)) return;
  try {
    await centerRequest(`/api/local/videos/${encodeURIComponent(recordId)}`, { method: 'DELETE' });
    await loadCenter();
    centerEls.status.textContent = '视频记录已删除。';
  } catch (error) {
    centerEls.status.textContent = error.message;
  }
}

function renderTables() {
  clearRows(centerEls.influencerRows);
  const influencerHelpers = getDashboardHelpers();
  getScopedInfluencerRows().slice(0, 300).forEach((fields) => {
    const normalized = normalizeInfluencerRow(fields, influencerHelpers);
    const tr = document.createElement('tr');
    addCell(tr, normalized.creatorName, '红人');
    addCell(tr, normalized.owner || '-', '负责人');
    addCell(tr, normalized.region || '-', '地区');
    addCell(tr, normalized.platform, '平台');
    const linkCell = addCell(tr, readLocalLink(fields['红人链接']), '主页链接');
    addCell(tr, readLocalText(fields['是否监控']), '是否监控');
    addCell(tr, readLocalText(fields['是否出视频'] || fields['是否发布视频']), '是否出视频');
    addCell(tr, readLocalText(fields['合作服务']) || readLocalText(fields['合作模式']) || '-', '合作服务');
    addCell(tr, readLocalText(fields['合同交付平台拆分']) || '-', '预计交付');
    const expected = rawNumber(fields['预计视频交付']);
    const completed = rawNumber(fields['已上线视频']);
    const progress = expected ? `${centerNumber(completed)} / ${centerNumber(expected)} (${Math.min(100, Math.round((completed / expected) * 100))}%)` : '-';
    addCell(tr, progress, '上线进度');
    addCell(tr, readLocalText(fields['合同交付解析状态']) || '-', '解析状态');
    centerEls.influencerRows.appendChild(tr);
  });

  clearRows(centerEls.videoRows);
  const videoFilters = getVideoTableFilters();
  normalizeData(getScopedVideoRows(centerPeriod))
    .filter((row) => videoRowPassesTableFilters(row, videoFilters))
    .sort((a, b) => b.views - a.views || (b.publishDate?.getTime?.() || 0) - (a.publishDate?.getTime?.() || 0))
    .slice(0, 1000)
    .forEach((row) => {
      const tr = document.createElement('tr');
      addCell(tr, row.creatorName, '红人');
      addCell(tr, row.owner, '负责人');
      addCell(tr, row.region, '区域');
      addCell(tr, row.platform, '平台');
      addCell(tr, centerDate(row.publishDate), '上线时间');
      addCell(tr, centerNumber(row.mature7dViews), '7日声量');
      addCell(tr, centerNumber(rawNumber(row.raw?.['30日成熟声量'] || row.raw?.mature30dViews)), '30日声量');
      addCell(tr, `${row.engagementRate}%`, '互动率');
      addCell(tr, readLocalText(row.raw?.['是否计入合同交付']) === '是' ? readLocalText(row.raw?.['对应合同平台'] || row.raw?.['合同交付类型']) || '已归因' : '-', '交付归因');
      const status = videoStatus(row);
      const statusCell = document.createElement('td');
      labelCell(statusCell, '状态');
      statusCell.innerHTML = `<span class="status-pill ${escapeHtml(status.level)}">${escapeHtml(status.label)}</span>`;
      tr.appendChild(statusCell);
      const url = row.videoUrl;
      const linkCell = document.createElement('td');
      labelCell(linkCell, '链接');
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = '打开';
        linkCell.appendChild(a);
      } else {
        linkCell.textContent = '-';
      }
      tr.appendChild(linkCell);
      const actionCell = document.createElement('td');
      labelCell(actionCell, '操作');
      if (!isStaticCenter && row.recordId) {
        const actions = document.createElement('div');
        actions.className = 'row-actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'row-action-button';
        editButton.textContent = '编辑';
        editButton.addEventListener('click', () => openVideoEditor(row.recordId));
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'row-action-button danger';
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', () => deleteVideoRecord(row.recordId));
        actions.append(editButton, deleteButton);
        actionCell.appendChild(actions);
      } else {
        actionCell.textContent = isStaticCenter ? '只读' : '-';
      }
      tr.appendChild(actionCell);
      centerEls.videoRows.appendChild(tr);
    });

  clearRows(centerEls.affiliateSalesRows);
  getAffiliateSalesAnalysis(centerPeriod)
    .slice(0, 400)
    .forEach((row) => {
      const tr = document.createElement('tr');
      addCell(tr, row.creator || row.affiliateName || '-', '达人');
      addCell(tr, row.email || '-', 'Email');
      addCell(tr, row.owner || '-', '负责人');
      addCell(tr, row.region || '-', '地区');
      const codeCell = document.createElement('td');
      labelCell(codeCell, '联盟 Code');
      const safeLink = safeExternalUrl(row.referralLink);
      codeCell.innerHTML = safeLink
        ? `<a href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.referralCode || '打开')}</a>`
        : escapeHtml(row.referralCode || '-');
      tr.appendChild(codeCell);
      addCell(tr, row.matchStatus === 'email_matched' ? `已匹配 / ${row.status}` : `未匹配 / ${row.status}`, '状态');
      addCell(tr, `${centerNumber(row.videos)} 条`, '当前周期视频');
      addCell(tr, centerNumber(row.views), dashboardVoiceLabel());
      addCell(tr, row.hasOrderMetrics ? centerNumber(row.orders) : '0', '订单');
      addCell(tr, row.hasOrderMetrics ? moneyBreakdownText(row.revenueByCurrency) : '0', 'GMV');
      addCell(tr, row.hasOrderMetrics ? moneyBreakdownText(row.commissionByCurrency) : '0', '佣金');
      centerEls.affiliateSalesRows.appendChild(tr);
    });

  clearRows(centerEls.snapshotRows);
  const ownerByCreator = getOwnerByCreator();
  (centerStore.snapshots || [])
    .map((row) => row.fields || row)
    .filter((fields) => dashboardFilters.owner === 'all' || getVideoOwner(fields, ownerByCreator) === dashboardFilters.owner)
    .slice(0, 300)
    .forEach((fields) => {
      const tr = document.createElement('tr');
      addCell(tr, centerDate(fields.capturedAt), '捕获时间');
      addCell(tr, readLocalText(fields['红人名称']), '红人');
      addCell(tr, readLocalText(fields.platform), '平台');
      addCell(tr, centerNumber(Math.max(Number(fields.videoPlayCount) || 0, Number(fields.videoViewCount) || 0)), '播放');
      addCell(tr, readLocalText(fields.snapshotType), '快照类型');
      centerEls.snapshotRows.appendChild(tr);
    });

  clearRows(centerEls.runRows);
  (centerStore.runs || []).slice(0, 300).forEach((row) => {
    const fields = row.fields || row;
    const tr = document.createElement('tr');
    addCell(tr, centerDate(fields.createdAt || fields.time), '时间');
    addCell(tr, readLocalText(fields.task || fields.name), '任务');
    addCell(tr, readLocalText(fields.status), '状态');
    addCell(tr, readLocalText(fields.message || fields.note), '说明');
    centerEls.runRows.appendChild(tr);
  });
}

function getLocalDiscoverPayload(dryRun) {
  return {
    dryRun,
    days: Number(centerEls.localDiscoverDays.value) || 7,
    maxItems: Number(centerEls.localDiscoverMaxItems.value) || 30,
    limitInfluencers: Number(centerEls.localDiscoverLimit.value) || 1,
    skipInfluencers: Number(centerEls.localDiscoverSkip.value) || 0,
    platformFilter: centerEls.localDiscoverPlatform.value || 'all',
    globalKeywords: centerEls.localDiscoverKeywords.value || 'yozma,yozmasport',
    tiktokApprovalId: dryRun ? '' : lastDiscoverApprovalId
  };
}

function setDiscoverBusy(isBusy) {
  centerEls.btnLocalDiscoverDryRun.disabled = isBusy;
  centerEls.btnLocalDiscoverRun.disabled = isBusy;
}

function summarizeDiscoverResult(data) {
  if (data.dryRun) {
    const audit = data.candidateAudit || {};
    const estimate = data.usageEstimate || {};
    return `候选检查完成：本地红人 ${audit.totalRows || 0} 条，活跃合作/钉选自动范围 ${audit.targetedRows || audit.selectedRows || 0} 条，本次队列 ${audit.queuedRows || 0} 条，Apify 预估约 $${Number(estimate.estimatedUsageUsd || 0).toFixed(2)}。`;
  }
  const summary = data.summary || {};
  return `本地抓取完成：处理 ${data.processedInfluencers || 0} 位，新增视频 ${summary.videoCreated || 0} 条，跳过重复 ${summary.videoSkipped || 0} 条，快照 ${summary.snapshotCreated || 0} 条，Apify 约 $${Number(summary.usageUsd || 0).toFixed(3)}。`;
}

function renderApifyEstimate(data) {
  if (!centerEls.apifyEstimateBox) return;
  const audit = data.candidateAudit || {};
  const estimate = data.usageEstimate || {};
  const budget = data.usageBudget || {};
  const platformRows = Object.entries(estimate.byPlatform || {})
    .map(([platform, row]) => `<span>${escapeHtml(platform)}：${row.count} 位，约 $${Number(row.estimatedUsd || 0).toFixed(2)}</span>`)
    .join('');
  centerEls.apifyEstimateBox.innerHTML = `
    <strong>自动范围：${audit.targetedRows || audit.selectedRows || 0} 位 · 本次候选：${audit.queuedRows || 0} 位 · Apify 预估约 $${Number(estimate.estimatedUsageUsd || 0).toFixed(2)}</strong>
    <p>${escapeHtml(estimate.estimateBasis || '真实费用以 Apify 返回为准。')}</p>
    <div>${platformRows || '<span>暂无候选</span>'}</div>
    <p>已人工停止新视频监控：${Number(audit.manuallyStoppedRows || 0)} 位；合同完成和已有上线视频不会自动停搜。</p>
    <p>预算硬上限：单 Actor $${Number(budget.policy?.perActorUsd || 1).toFixed(2)} · 单批剩余 $${Number(budget.batchRemainingUsd || 0).toFixed(2)} · 本月剩余 $${Number(budget.monthRemainingUsd || 0).toFixed(2)}</p>`;
}

async function loadCenter() {
  centerEls.status.textContent = isStaticCenter ? '正在加载团队只读快照...' : '正在加载本地中台数据...';
  const [collections, dashboard, creatorLocations, targetingOpportunities] = await Promise.all([
    centerRequest('/api/local/collections'),
    centerRequest('/api/local/dashboard?weeks=8'),
    loadCreatorLocations(),
    loadTargetingOpportunities()
  ]);
  centerStore = collections.collections || {};
  centerStore.creatorLocations = creatorLocations || { locations: [] };
  centerDashboard = dashboard.dashboard || {};
  centerTargeting = targetingOpportunities;
  invalidateDashboardCaches();
  const summary = centerDashboard.summary || {};
  centerEls.localInfluencers.textContent = centerNumber(collections.counts?.influencers);
  centerEls.localVideos.textContent = centerNumber(collections.counts?.videos);
  centerEls.localSnapshots.textContent = centerNumber(collections.counts?.snapshots);
  centerEls.localViews.textContent = centerNumber(summary.totalViews);
  centerEls.weekVideos.textContent = centerNumber(summary.thisWeekVideos);
  centerEls.weekCreators.textContent = centerNumber(summary.thisWeekCreators);
  centerEls.weekViews.textContent = centerNumber(summary.thisWeekViews);
  centerEls.monthVideos.textContent = centerNumber(summary.thisMonthVideos);
  centerEls.monthCreators.textContent = centerNumber(summary.thisMonthCreators);
  centerEls.monthViews.textContent = centerNumber(summary.thisMonthViews);
  centerEls.totalVideos.textContent = centerNumber(summary.totalVideos);
  centerEls.totalCreators.textContent = centerNumber(summary.totalCreators);
  centerEls.totalViews.textContent = centerNumber(summary.totalViews);
  if (!customRange.start || !customRange.end) {
    const weekStart = centerDashboard.currentWeek?.weekStart ? new Date(centerDashboard.currentWeek.weekStart) : new Date();
    const weekEnd = centerDashboard.currentWeek?.weekEnd ? new Date(centerDashboard.currentWeek.weekEnd) : new Date();
    customRange = { start: weekStart.toISOString(), end: weekEnd.toISOString() };
    if (centerEls.dateStart) centerEls.dateStart.value = dateInputValue(weekStart);
    if (centerEls.dateEnd) centerEls.dateEnd.value = dateInputValue(new Date(weekEnd.getTime() - 24 * 60 * 60 * 1000));
  }
  centerEls.updatedAt.textContent = `更新于 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;
  populateDashboardFilters();
  populateVideoFilters();
  renderDashboardCharts();
  renderCurrentPeriod();
  renderCustomSummaryCard();
  updatePeriodCardState();
  renderTables();
  alignHashTargetAfterRender();
  centerEls.status.textContent = isStaticCenter ? '团队只读快照已加载。' : '本地中台已加载。';
}

function updatePeriodCardState() {
  document.querySelectorAll('.period-card[data-period-card]').forEach((card) => {
    card.classList.toggle('highlight', card.dataset.periodCard === centerPeriod);
  });
  updateDashboardControlState();
}

function activatePeriod(period) {
  centerPeriod = period || 'week';
  document.querySelectorAll('#centerPeriodControl button').forEach((item) => {
    item.classList.toggle('active', item.dataset.period === centerPeriod);
  });
  updatePeriodCardState();
  renderPeriodSensitiveViews();
}

document.querySelectorAll('.center-nav').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.center-nav').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('.center-section').forEach((section) => section.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(`section${button.dataset.section[0].toUpperCase()}${button.dataset.section.slice(1)}`).classList.add('active');
  });
});

document.querySelectorAll('#centerPeriodControl button').forEach((button) => {
  button.addEventListener('click', () => {
    activatePeriod(button.dataset.period || 'week');
  });
});

document.querySelectorAll('#voiceMetricControl button').forEach((button) => {
  button.addEventListener('click', () => {
    const nextMode = button.dataset.voiceMode === 'mature' ? 'mature' : 'live';
    if (nextMode === dashboardVoiceMode) return;
    dashboardVoiceMode = nextMode;
    localStorage.setItem('yozma-dashboard-voice-mode', dashboardVoiceMode);
    scopedVideoRowsCache = new Map();
    geoStatsCache = new Map();
    syncVoiceMetricLabels();
    renderPeriodSensitiveViews();
    renderOpsCommandCenter();
    renderOpsMonitor();
    renderTables();
    centerEls.status.textContent = dashboardVoiceMode === 'mature'
      ? '已切换到7日成熟声量：适合公平复盘。'
      : '已切换到即时播放：适合查看当前增长和爆款。';
  });
});

if (centerEls.btnApplyCustomRange) {
  centerEls.btnApplyCustomRange.addEventListener('click', () => {
    const start = startOfInputDay(centerEls.dateStart.value);
    const end = exclusiveEndOfInputDay(centerEls.dateEnd.value);
    if (!start || !end) {
      centerEls.status.textContent = '请选择开始日期和结束日期。';
      return;
    }
    if (end <= start) {
      centerEls.status.textContent = '结束日期必须晚于或等于开始日期。';
      return;
    }
    customRange = { start: start.toISOString(), end: end.toISOString() };
    activatePeriod('custom');
    centerEls.status.textContent = `已切换到自定义时间：${dateOnlyLabel(start)} - ${dateOnlyLabel(new Date(end.getTime() - 24 * 60 * 60 * 1000))}`;
  });
}

if (centerEls.btnExportScopedVideos) {
  centerEls.btnExportScopedVideos.addEventListener('click', exportScopedVideosCsv);
}

function applyDashboardFiltersFromControls() {
  dashboardFilters.platform = centerEls.platformFilter?.value || 'all';
  dashboardFilters.region = centerEls.regionFilter?.value || 'all';
  dashboardFilters.owner = centerEls.ownerFilter?.value || 'all';
  dashboardFilters.country = 'all';
  mapDrillMode = 'world';
  selectedMapPlaceKey = '';
  syncCustomFilterSelects();
  renderPeriodSensitiveViews();
  renderOpsCommandCenter();
  renderOpsMonitor();
  renderTables();
}

[centerEls.platformFilter, centerEls.regionFilter, centerEls.ownerFilter].forEach((select) => {
  if (!select) return;
  select.addEventListener('change', applyDashboardFiltersFromControls);
});

if (centerEls.btnResetDashboardFilters) {
  centerEls.btnResetDashboardFilters.addEventListener('click', () => {
    dashboardFilters = { platform: 'all', region: 'all', owner: 'all', country: 'all' };
    mapDrillMode = 'world';
    selectedMapPlaceKey = '';
    [centerEls.platformFilter, centerEls.regionFilter, centerEls.ownerFilter].forEach((select) => {
      if (select) select.value = 'all';
    });
    syncCustomFilterSelects();
    renderPeriodSensitiveViews();
    renderOpsCommandCenter();
    renderOpsMonitor();
    renderTables();
  });
}

if (centerEls.btnResetMapFilter) {
  centerEls.btnResetMapFilter.addEventListener('click', () => {
    resetMapToWorld();
  });
}

if (centerEls.videoTableSearch) {
  centerEls.videoTableSearch.addEventListener('input', renderTables);
}

[centerEls.videoFilterStart, centerEls.videoFilterEnd, centerEls.videoFilterPlatform, centerEls.videoFilterOwner].forEach((control) => {
  if (control) control.addEventListener('change', renderTables);
});

if (centerEls.btnResetVideoFilters) {
  centerEls.btnResetVideoFilters.addEventListener('click', () => {
    if (centerEls.videoTableSearch) centerEls.videoTableSearch.value = '';
    if (centerEls.videoFilterStart) centerEls.videoFilterStart.value = '';
    if (centerEls.videoFilterEnd) centerEls.videoFilterEnd.value = '';
    if (centerEls.videoFilterPlatform) centerEls.videoFilterPlatform.value = 'all';
    if (centerEls.videoFilterOwner) centerEls.videoFilterOwner.value = 'all';
    renderTables();
  });
}

if (centerEls.btnCloseVideoEditor) centerEls.btnCloseVideoEditor.addEventListener('click', closeVideoEditor);
if (centerEls.btnSaveVideoEditor) centerEls.btnSaveVideoEditor.addEventListener('click', saveVideoEditor);
document.querySelectorAll('[data-close-video-editor]').forEach((button) => button.addEventListener('click', closeVideoEditor));

const DASHBOARD_INTERACTION_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  '.center-nav',
  '.period-card',
  '.dashboard-focus-card',
  '.battle-card',
  '.trend-card',
  '.monitor-card',
  '.situation-card',
  '.global-map-card',
  '.global-detail-card',
  '.global-bars-card',
  '.data-health-card',
  '.targeting-kpi-card',
  '.targeting-card',
  '.targeting-opportunity',
  '.targeting-strategy-card',
  '.anniversary-card',
  '.anniversary-kpi-card',
  '.global-map-canvas',
  '.geo-bar-row',
  '.map-detail-hero',
  '.region-card',
  '.region-board-card',
  '.owner-card',
  '.owner-board-card',
  '.affiliate-kpi-card',
  '.affiliate-correlation-row',
  '.tier-card',
  '.tier-board-card',
  '.tier-benchmark-card',
  '.platform-row',
  '.platform-brief-row',
  '.weekly-pulse-card',
  '.rank-list li',
  '.metric-grid.compact article',
  '.dashboard-command-rail'
].join(',');

function setupDashboardInteractionEffects() {
  const motionSafe = !window.matchMedia || window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  if (!motionSafe) return;
  const dashboardRoot = document.querySelector('.data-center');
  const pointerFine = (!window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches) && (navigator.maxTouchPoints || 0) < 1;
  let activePointerTarget = null;

  function clearPointerTarget() {
    if (!activePointerTarget) return;
    activePointerTarget.classList.remove('is-pointer-glowing');
    activePointerTarget = null;
  }

  if (pointerFine) {
    document.addEventListener('pointermove', (event) => {
      const target = event.target.closest(DASHBOARD_INTERACTION_SELECTOR);
      if (!target || !dashboardRoot?.contains(target)) {
        clearPointerTarget();
        return;
      }
      const rect = target.getBoundingClientRect();
      if (rect.width && rect.height) {
        if (activePointerTarget !== target) {
          clearPointerTarget();
          activePointerTarget = target;
          target.classList.add('dashboard-interaction-surface', 'is-pointer-glowing');
        }
        target.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        target.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      }
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      clearPointerTarget();
    }, { passive: true });
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('input, select, textarea, .custom-select-menu')) return;
    const target = event.target.closest(DASHBOARD_INTERACTION_SELECTOR);
    if (!target || !dashboardRoot?.contains(target)) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = Math.max(76, Math.min(260, Math.max(rect.width, rect.height) * 0.52));
    const ripple = document.createElement('span');
    ripple.className = 'dashboard-click-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.classList.add('dashboard-interaction-surface', 'is-click-glowing');
    target.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 760);
    window.setTimeout(() => target.classList.remove('is-click-glowing'), 360);
  }, { capture: true });
}

setupDashboardInteractionEffects();

document.addEventListener('click', (event) => {
  const mapTarget = event.target.closest('[data-map-place]');
  if (!mapTarget) return;
  selectedMapPlaceKey = mapTarget.dataset.mapPlace || '';
  const rows = getMapRowsForMode(centerPeriod);
  const row = rows.find((item) => item.placeKey === selectedMapPlaceKey);
  const drillMode = row?.mapCountry ? MAP_COUNTRY_TO_DRILL_MODE[row.mapCountry] : '';
  if (drillMode && !MAP_DRILL_CONFIG[mapDrillMode]) {
    enterMapDrill(drillMode, row.mapCountry);
    return;
  } else if (!MAP_DRILL_CONFIG[mapDrillMode]) {
    dashboardFilters.country = row?.mapCountry || 'all';
  }
  renderGlobalMap();
  scheduleMapDependentRender();
});

document.querySelectorAll('[data-jump-section]').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('a, button, input, select, textarea')) return;
    const target = card.dataset.jumpSection;
    const nav = document.querySelector(`.center-nav[data-section="${target}"]`);
    if (nav) nav.click();
  });
});

document.addEventListener('click', (event) => {
  const jumpTarget = event.target.closest('[data-dashboard-jump]');
  if (!jumpTarget) return;
  const target = document.getElementById(jumpTarget.dataset.dashboardJump);
  if (target) {
    scrollToCenterTarget(target);
  }
});

window.addEventListener('resize', () => {
  worldMapChart?.resize();
  weeklyTrendEchart?.resize();
  platformCompareChart?.resize();
  if (activeCustomSelect) positionCustomSelectMenu(activeCustomSelect);
});
window.addEventListener('scroll', () => {
  syncCompactTopbar();
  if (activeCustomSelect) positionCustomSelectMenu(activeCustomSelect);
}, { passive: true });
window.addEventListener('hashchange', alignHashTargetAfterRender);

document.addEventListener('click', (event) => {
  if (!activeCustomSelect) return;
  if (activeCustomSelect.trigger.contains(event.target) || activeCustomSelect.menu.contains(event.target)) return;
  closeCustomSelect();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCustomSelect();
});

centerEls.btnRefresh.addEventListener('click', () => loadCenter().catch((error) => (centerEls.status.textContent = error.message)));
centerEls.btnPrint.addEventListener('click', () => window.print());
centerEls.btnImportDingTalk.addEventListener('click', async () => {
  centerEls.status.textContent = '正在从钉钉导入本地中台...';
  const data = await centerRequest('/api/local/import-dingtalk', { method: 'POST' });
  const message = `导入完成：红人 ${data.counts.influencers}，视频 ${data.counts.videos}，快照 ${data.counts.snapshots}。`;
  centerEls.status.textContent = message;
  await loadCenter();
  centerEls.status.textContent = message;
});
centerEls.btnImportInfluencers.addEventListener('click', async () => {
  const text = centerEls.importText.value.trim();
  if (!text) {
    centerEls.status.textContent = '请先粘贴红人主页链接。';
    return;
  }
  const data = await centerRequest('/api/local/influencers/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const message = `导入完成：新增 ${data.imported} 条，本地红人总数 ${data.total}。`;
  centerEls.status.textContent = message;
  centerEls.importText.value = '';
  await loadCenter();
  centerEls.status.textContent = message;
});
centerEls.btnImportVideos.addEventListener('click', async () => {
  try {
    let text = centerEls.importVideoText.value.trim();
    const file = centerEls.importVideoFile.files?.[0];
    if (file) text = await readFileAsText(file);
    const rows = parseVideoImportRows(text);
    if (!rows.length) {
      centerEls.status.textContent = '请先粘贴视频链接，或上传 CSV 模板文件。';
      return;
    }
    centerEls.status.textContent = '正在导入视频链接到本地视频上线表...';
    const data = await centerRequest('/api/local/videos/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    const message = `视频导入完成：新增 ${data.imported} 条，跳过 ${data.skipped} 条，本地视频总数 ${data.total}。`;
    centerEls.status.textContent = message;
    centerEls.importVideoText.value = '';
    centerEls.importVideoFile.value = '';
    await loadCenter();
    centerEls.status.textContent = message;
  } catch (error) {
    centerEls.status.textContent = error.message;
  }
});
centerEls.btnLocalDiscoverDryRun.addEventListener('click', async () => {
  setDiscoverBusy(true);
  try {
    centerEls.status.textContent = '正在检查本地抓取候选，不会调用 Apify...';
    const data = await centerRequest('/api/local/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getLocalDiscoverPayload(true))
    });
    lastDiscoverApprovalId = data.approvalId || '';
    centerEls.confirmApifyRun.checked = false;
    centerEls.status.textContent = summarizeDiscoverResult(data);
    renderApifyEstimate(data);
  } catch (error) {
    centerEls.status.textContent = error.message;
  } finally {
    setDiscoverBusy(false);
  }
});
centerEls.btnLocalDiscoverRun.addEventListener('click', async () => {
  if (!centerEls.confirmApifyRun.checked) {
    centerEls.status.textContent = '真实抓取会调用 Apify。请先点击“免费检查候选”，确认人数和预估费用后勾选确认框。';
    return;
  }
  setDiscoverBusy(true);
  try {
    centerEls.status.textContent = '正在调用 Apify 并写入本地中台，请保持页面打开...';
    const data = await centerRequest('/api/local/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getLocalDiscoverPayload(false))
    });
    const message = summarizeDiscoverResult(data);
    centerEls.status.textContent = message;
    await loadCenter();
    centerEls.status.textContent = message;
  } catch (error) {
    centerEls.status.textContent = error.message;
  } finally {
    setDiscoverBusy(false);
  }
});

configureStaticMode();
syncCompactTopbar();
loadCenter().catch((error) => {
  centerEls.status.textContent = `中台加载失败：${error.message}`;
});
