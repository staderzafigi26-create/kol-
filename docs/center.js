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
  monthVideos: document.getElementById('centerMonthVideos'),
  monthCreators: document.getElementById('centerMonthCreators'),
  monthViews: document.getElementById('centerMonthViews'),
  totalVideos: document.getElementById('centerTotalVideos'),
  totalCreators: document.getElementById('centerTotalCreators'),
  totalViews: document.getElementById('centerTotalViews'),
  customVideos: document.getElementById('centerCustomVideos'),
  customCreators: document.getElementById('centerCustomCreators'),
  customViews: document.getElementById('centerCustomViews'),
  customRangeLabel: document.getElementById('centerCustomRangeLabel'),
  dateStart: document.getElementById('centerDateStart'),
  dateEnd: document.getElementById('centerDateEnd'),
  btnApplyCustomRange: document.getElementById('btnApplyCustomRange'),
  platformFilter: document.getElementById('centerPlatformFilter'),
  regionFilter: document.getElementById('centerRegionFilter'),
  ownerFilter: document.getElementById('centerOwnerFilter'),
  filterSummary: document.getElementById('dashboardFilterSummary'),
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
  tierGrid: document.getElementById('centerTierGrid'),
  tierPeriodLabel: document.getElementById('tierPeriodLabel'),
  tierBenchmarkGrid: document.getElementById('tierBenchmarkGrid'),
  tierLeaderboardGrid: document.getElementById('tierLeaderboardGrid'),
  battleInsightGrid: document.getElementById('battleInsightGrid'),
  followupPoolGrid: document.getElementById('followupPoolGrid'),
  lifecycleGrid: document.getElementById('lifecycleGrid'),
  qualityGrid: document.getElementById('qualityGrid'),
  globalMapCanvas: document.getElementById('globalMapCanvas'),
  globalMapDetail: document.getElementById('globalMapDetail'),
  globalRegionBars: document.getElementById('globalRegionBars'),
  globalMapScopeLabel: document.getElementById('globalMapScopeLabel'),
  activityHeatmap: document.getElementById('activityHeatmap'),
  platformOrbit: document.getElementById('platformOrbit'),
  weeklyTrendChart: document.getElementById('weeklyTrendChart'),
  weeklyPulseGrid: document.getElementById('weeklyPulseGrid'),
  monthlyBarChart: document.getElementById('monthlyBarChart'),
  platformPieChart: document.getElementById('platformPieChart'),
  platformMatrix: document.getElementById('platformMatrix'),
  hotVideoBubbleChart: document.getElementById('hotVideoBubbleChart'),
  regionMissingNotice: document.getElementById('regionMissingNotice'),
  regionSummaryGrid: document.getElementById('regionSummaryGrid'),
  regionLeaderboardGrid: document.getElementById('regionLeaderboardGrid'),
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
let centerPeriod = 'week';
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
let dashboardIndexCache = {
  followerByCreator: null,
  locationByCreator: null,
  regionByCreator: null,
  ownerByCreator: null,
  milestone7dByPostKey: null
};
let scopedVideoRowsCache = new Map();
let geoStatsCache = new Map();
let pendingMapSync = null;
const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const isStaticCenter = !localHostnames.has(location.hostname) || new URLSearchParams(location.search).has('static');

function assetUrl(path) {
  return String(path || '').replace(/^\/+/, '');
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
    ['/api/local/export/influencers?format=json', 'static-data/exports/influencers.json'],
    ['/api/local/export/videos?format=json', 'static-data/exports/videos.json'],
    ['/api/local/templates/video-import.xlsx', 'data/templates/video-import-template.xlsx'],
    ['/api/local/templates/video-import.csv', 'data/templates/dingtalk-csv/视频表.csv']
  ];
  for (const [from, to] of staticExportLinks) {
    document.querySelectorAll(`a[href="${from}"]`).forEach((link) => {
      link.href = assetUrl(to);
    });
  }
  document.querySelectorAll('[data-section="importExport"]').forEach((el) => {
    el.style.display = 'none';
  });
  document.querySelectorAll('[data-section="affiliateSales"], [data-dashboard-jump="dashboardAffiliateSales"]').forEach((el) => {
    el.style.display = 'none';
  });
  const importSection = document.getElementById('sectionImportExport');
  if (importSection) importSection.style.display = 'none';
  const affiliateSection = document.getElementById('sectionAffiliateSales');
  if (affiliateSection) affiliateSection.style.display = 'none';
  const affiliateDashboard = document.getElementById('dashboardAffiliateSales');
  if (affiliateDashboard) affiliateDashboard.style.display = 'none';
  [centerEls.btnImportDingTalk, centerEls.btnImportInfluencers, centerEls.btnImportVideos, centerEls.btnLocalDiscoverDryRun, centerEls.btnLocalDiscoverRun].forEach((button) => {
    if (!button) return;
    button.disabled = true;
    button.title = '团队只读版不支持导入、写入或抓取。';
  });
}

function syncCompactTopbar() {
  document.body.classList.toggle('compact-topbar', window.scrollY > 72);
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
    milestone7dByPostKey: null
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
    dashboardFilters.country
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

function centerDate(value) {
  if (!value) return '-';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function fullDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour12: false }).format(date);
}

function dateInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateOnlyLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
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
      const response = await fetch(assetUrl('static-data/collections.json'), { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `静态数据加载失败：HTTP ${response.status}`);
      return data;
    }
    if (String(url).startsWith('/api/local/dashboard')) {
      const response = await fetch(assetUrl('static-data/dashboard.json'), { cache: 'no-store' });
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
    const response = await fetch(assetUrl('data/creator-locations.json'), { cache: 'no-store' });
    if (!response.ok) return { locations: [] };
    return response.json();
  } catch (_error) {
    return { locations: [] };
  }
}

function clearRows(tbody) {
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
}

function addCell(row, text) {
  const cell = document.createElement('td');
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

function videoUrl(fields) {
  return safeExternalUrl(readLocalLink(fields.url) || readLocalLink(fields['视频链接']) || fields.url || '');
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

function sevenDayVideoViews(fields) {
  const snapshot = getMilestone7dByPostKey().get(videoPostKey(fields))?.fields;
  if (!snapshot) return 0;
  return Math.max(rawNumber(snapshot.videoPlayCount), rawNumber(snapshot.videoViewCount));
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
    const creator = creatorKey(readLocalText(fields['红人名称']));
    const looseCreator = creatorLooseKey(readLocalText(fields['红人名称']));
    const handle = handleFromProfileUrl(fields['红人链接']);
    if (!creator && !looseCreator && !handle) continue;
    const region = readRegionField(fields);
    if (!region) continue;
    const keys = [
      creator,
      looseCreator ? `loose:${looseCreator}` : '',
      handle ? creatorKey(handle) : '',
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
    const creator = creatorKey(readLocalText(fields['红人名称']));
    const looseCreator = creatorLooseKey(readLocalText(fields['红人名称']));
    const handle = handleFromProfileUrl(fields['红人链接']);
    const keys = [
      creator,
      looseCreator ? `loose:${looseCreator}` : '',
      handle ? creatorKey(handle) : '',
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
  const manualRegionAliases = {
    anthonymoreno: 'US',
    excdesignsus: 'US',
    teddyvr: 'US',
    tensei: 'UK'
  };
  if (loose && manualRegionAliases[loose]) return manualRegionAliases[loose];
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
  const manualOwnerAliases = {
    anthonymoreno: 'Ryan',
    excdesignsus: '未标注负责人',
    teddyvr: 'Ryan',
    tensei: 'Zoe'
  };
  if (loose && manualOwnerAliases[loose]) return manualOwnerAliases[loose];
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
  const publishedAt = new Date(fields.timestamp);
  if (Number.isNaN(publishedAt.getTime())) return false;
  const bounds = periodBounds(period);
  const start = new Date(bounds.weekStart || bounds.monthStart || bounds.customStart || '');
  const end = new Date(bounds.weekEnd || bounds.monthEnd || bounds.customEnd || '');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
  return publishedAt >= start && publishedAt < end;
}

function videoPublishedAt(fields) {
  const date = new Date(fields.timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
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
  const views = sevenDayVideoViews(fields);
  const likes = rawNumber(fields.likesCount);
  const comments = rawNumber(fields.commentsCount);
  const publishedAt = videoPublishedAt(fields);
  const platform = platformLabel(readLocalText(fields['平台']));
  const region = getVideoRegion(fields, regionByCreator);
  const owner = getVideoOwner(fields, ownerByCreator);
  return {
    id: readLocalText(fields.postId) || videoUrl(fields) || `${creatorName}_${fields.timestamp || ''}`,
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
    .map((row) => row.fields || row)
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
    views: rows.reduce((sum, fields) => sum + sevenDayVideoViews(fields), 0)
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
    views: scoped.reduce((sum, fields) => sum + videoViews(fields), 0),
    mature7dViews: scoped.reduce((sum, fields) => sum + sevenDayVideoViews(fields), 0),
    mature7dVideos: scoped.filter((fields) => sevenDayVideoViews(fields) > 0).length
  };
}

function getWeeklyTrendRows() {
  const rows = centerDashboard.weekly || [];
  if (!hasDashboardFilterScope()) return rows;
  const scopedVideos = getScopedVideoRows('total');
  return rows.map((row) => summarizeVideoRowsForRange(scopedVideos, 'weekStart', 'weekEnd', row));
}

function getMonthlyTrendRows() {
  const rows = centerDashboard.monthly || [];
  if (!hasDashboardFilterScope()) return rows;
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
    const views = sevenDayVideoViews(fields);
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
      const views = sevenDayVideoViews(fields);
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
  const stats = {
    firstSevenDays: 0,
    sevenDayDue: 0,
    thirtyDayTracking: 0,
    thirtyDayDue: 0,
    stopTracking: 0,
    missingTime: 0
  };
  for (const fields of rows) {
    const publishedAt = videoPublishedAt(fields);
    const age = daysSince(publishedAt, now);
    if (age === null) {
      stats.missingTime += 1;
      continue;
    }
    if (age <= 7) stats.firstSevenDays += 1;
    if (age >= 6 && age <= 8) stats.sevenDayDue += 1;
    if (age > 7 && age <= 30) stats.thirtyDayTracking += 1;
    if (age >= 28 && age <= 31) stats.thirtyDayDue += 1;
    if (age > 30) stats.stopTracking += 1;
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

function renderLineChart(target, rows, keyA, keyB) {
  const data = Array.isArray(rows) && rows.length ? rows : [];
  if (!target || !data.length) {
    if (target) target.innerHTML = '<div class="empty-cell">暂无趋势数据</div>';
    return;
  }
  weeklyTrendEchart = getChartInstance(target, weeklyTrendEchart);
  if (!weeklyTrendEchart) return;
  weeklyTrendEchart.setOption({
    backgroundColor: 'transparent',
    color: ['#33D6C5', '#4DA3FF'],
    tooltip: { trigger: 'axis', backgroundColor: '#121C2B', borderColor: 'rgba(255,255,255,.1)', textStyle: { color: '#F7F8FA' } },
    legend: { top: 0, right: 6, textStyle: { color: '#A8B3C7' } },
    grid: { left: 42, right: 22, top: 44, bottom: 34 },
    xAxis: { type: 'category', data: data.map((row) => shortDate(row.weekStart)), axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } }, axisLabel: { color: '#A8B3C7' } },
    yAxis: [
      { type: 'value', name: '视频', axisLabel: { color: '#A8B3C7' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.07)' } } },
      { type: 'value', name: '7日声量', axisLabel: { color: '#A8B3C7', formatter: (value) => centerNumber(value) }, splitLine: { show: false } }
    ],
    series: [
      { name: '上线视频', type: 'line', smooth: true, areaStyle: { opacity: 0.12 }, data: data.map((row) => Number(row[keyA]) || 0) },
      { name: '7日成熟声量', type: 'line', yAxisIndex: 1, smooth: true, areaStyle: { opacity: 0.1 }, data: data.map((row) => Number(row[keyB]) || 0) }
    ]
  }, true);
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
    color: ['#4DA3FF', '#33D6C5', '#FFB454'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#121C2B', borderColor: 'rgba(255,255,255,.1)', textStyle: { color: '#F7F8FA' } },
    legend: { top: 0, right: 6, textStyle: { color: '#A8B3C7' } },
    grid: { left: 42, right: 22, top: 44, bottom: 42 },
    xAxis: { type: 'category', data: data.map((row) => row.platform), axisLabel: { color: '#A8B3C7', interval: 0, rotate: data.length > 3 ? 18 : 0 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } } },
    yAxis: { type: 'value', axisLabel: { color: '#A8B3C7', formatter: (value) => centerNumber(value) }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.07)' } } },
    series: [
      { name: '7日声量', type: 'bar', barMaxWidth: 28, data: data.map((row) => row.views) },
      { name: '视频数', type: 'bar', barMaxWidth: 28, data: data.map((row) => row.videos) },
      { name: '7日均播', type: 'line', smooth: true, data: data.map((row) => row.avgViews) }
    ]
  }, true);
  resizeChartAfterLayout(platformCompareChart);
}

function getPlatformDistribution(period = centerPeriod) {
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const platform = readLocalText(fields['平台']) || 'unknown';
    map.set(platform, (map.get(platform) || 0) + 1);
  }
  return [...map.entries()]
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

function getPlatformStats(period = centerPeriod) {
  const map = new Map();
  for (const fields of getScopedVideoRows(period)) {
    const platform = readLocalText(fields['平台']) || 'unknown';
    const key = platformLabel(platform);
    const views = sevenDayVideoViews(fields);
    const creator = readLocalText(fields['红人名称']) || '-';
    const url = videoUrl(fields);
    if (!map.has(key)) {
      map.set(key, {
        platform: key,
        rawPlatform: platform,
        videos: 0,
        views: 0,
        topCreator: '-',
        topViews: 0,
        topUrl: ''
      });
    }
    const stat = map.get(key);
    stat.videos += 1;
    stat.views += views;
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

function renderBattleInsights() {
  if (!centerEls.battleInsightGrid) return;
  const quality = getQualityIssues();
  const lifecycle = getLifecycleStats();
  const rows = getScopedVideoRows(centerPeriod);
  const normalized = normalizeData(rows);
  const topRegion = getRegionStats(centerPeriod)[0] || {};
  const topPlatform = getPlatformStats(centerPeriod)[0] || {};
  const topCreator = getCreatorVideoStats(centerPeriod)[0] || {};
  const missingRegion = normalized.filter((row) => row.region === '未标注地区' || row.country === 'UNKNOWN').length;
  const missingOwner = normalized.filter((row) => row.owner === '未标注负责人').length;
  const lowPerformance = normalized.filter((row) => row.views > 0 && row.views < 1000).length;
  const highValue = normalized.filter((row) => row.views >= 50000 || row.engagementRate >= 5).length;
  const cards = [
    {
      label: '数据缺失',
      value: `${centerNumber(quality.missingFollowers + missingRegion + missingOwner)} 项`,
      delta: { text: `缺粉丝 ${centerNumber(quality.missingFollowers)} · 缺地区 ${centerNumber(missingRegion)} · 缺负责人 ${centerNumber(missingOwner)}`, className: 'down' },
      progress: Math.min(100, quality.missingFollowers + missingRegion + missingOwner),
      note: '先补字段，否则分层、地区和负责人周报会失真'
    },
    {
      label: '跟进提醒',
      value: `${centerNumber(lifecycle.sevenDayDue + lifecycle.thirtyDayDue)} 条`,
      delta: { text: `7天 ${centerNumber(lifecycle.sevenDayDue)} · 30天 ${centerNumber(lifecycle.thirtyDayDue)}`, className: 'flat' },
      progress: Math.min(100, lifecycle.sevenDayDue + lifecycle.thirtyDayDue),
      note: '到了 7 天和 30 天节点的视频需要更新表现'
    },
    {
      label: '高价值机会',
      value: `${centerNumber(highValue)} 条`,
      delta: { text: `最佳达人：${topCreator.creator || '-'}`, className: 'up' },
      progress: Math.min(100, highValue * 8),
      note: '高播放或高互动内容适合复盘脚本、平台和地区'
    },
    {
      label: '本周最强信号',
      value: topRegion.region || '-',
      delta: { text: `${topPlatform.platform || '-'} · ${centerNumber(topPlatform.views || 0)} 7日声量`, className: 'up' },
      progress: Math.min(100, Math.round(((topRegion.views || 0) / Math.max(1, normalized.reduce((sum, row) => sum + row.views, 0))) * 100)),
      note: `低表现视频 ${centerNumber(lowPerformance)} 条，可进入视频表筛选处理`
    }
  ];
  centerEls.battleInsightGrid.innerHTML = cards
    .map(
      (card) => `<article class="battle-card">
        <span>${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <p class="${card.delta.className}">${escapeHtml(card.delta.text)}</p>
        <div class="battle-meter"><i style="width:${Math.max(6, card.progress)}%"></i></div>
        <small>${escapeHtml(card.note)}</small>
      </article>`
    )
    .join('');
}

function renderCommandKpis() {
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
      `周报周期 ${centerNumber(current.videos)} 条视频 / ${centerNumber(current.mature7dViews ?? current.views)} 7日声量`,
      topPlatform.platform ? `${topPlatform.platform} 当前最强，${centerNumber(topPlatform.views)} 7日声量` : '暂无平台表现数据',
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
    .slice(0, 5);
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
    ].slice(0, 8);
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

function renderActivityHeatmap() {
  if (!centerEls.activityHeatmap) return;
  const rows = getWeeklyTrendRows();
  if (!rows.length) {
    centerEls.activityHeatmap.innerHTML = '<div class="empty-cell">暂无周活跃数据</div>';
    return;
  }
  const maxViews = Math.max(...rows.map((row) => rawNumber(row.mature7dViews ?? row.views)), 1);
  centerEls.activityHeatmap.innerHTML = rows
    .map((row) => {
      const views = rawNumber(row.mature7dViews ?? row.views);
      const videos = rawNumber(row.videos);
      const creators = rawNumber(row.creators);
      const heat = Math.round((views / maxViews) * 100);
      return `<article class="heat-cell" style="--heat:${Math.max(8, heat)}%">
        <span>${shortDate(row.weekStart)}-${shortDate(row.weekEnd)}</span>
        <strong>${centerNumber(videos)} 条</strong>
        <small>${centerNumber(creators)} 位 · ${centerNumber(views)}</small>
      </article>`;
    })
    .join('');
}

function renderPlatformOrbit() {
  if (!centerEls.platformOrbit) return;
  const rows = getPlatformStats(centerPeriod).slice(0, 4);
  if (!rows.length) {
    centerEls.platformOrbit.innerHTML = '<div class="empty-cell">暂无平台效率数据</div>';
    return;
  }
  const maxAvgViews = Math.max(...rows.map((row) => row.avgViews), 1);
  const best = rows.reduce((winner, row) => (row.avgViews > winner.avgViews ? row : winner), rows[0]);
  const nodes = rows
    .map((row, index) => {
      const size = 72 + Math.round((row.avgViews / maxAvgViews) * 34);
      return `<article class="orbit-node platform-${platformClass(row.platform)}" style="--size:${size}px;--delay:${index * 150}ms">
        <i><b>${escapeHtml(shortPlatformName(row.platform))}</b><span>${centerNumber(row.avgViews)}</span></i>
        <div>
          <strong>最高 ${centerNumber(row.topViews || 0)}</strong>
          <span>${centerNumber(row.videos || 0)} 条视频</span>
          <em>均播 ${centerNumber(row.avgViews)}</em>
        </div>
      </article>`;
    })
    .join('');
  centerEls.platformOrbit.innerHTML = `
    <div class="orbit-core">
      <span>最佳效率平台</span>
      <strong>${escapeHtml(shortPlatformName(best.platform))}</strong>
      <em>${centerNumber(best.avgViews)} 7日均播 · 最高 ${centerNumber(best.topViews || 0)}</em>
    </div>
    <div class="orbit-node-grid">${nodes}</div>`;
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
          <div><dt>7日声量</dt><dd>${centerNumber(row.views)}</dd></div>
          <div><dt>7日均播</dt><dd>${centerNumber(row.avgViews)}</dd></div>
          <div><dt>最强达人</dt><dd>${topCreator}</dd></div>
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

function mapPaletteForMode(mode) {
  return MAP_DRILL_CONFIG[mode]?.palette || ['#172235', '#1E5A78', '#33D6C5', '#FFB454', '#E63946'];
}

function mapVideoHeatColor(videos, maxVideos) {
  const ratio = maxVideos ? Math.min(1, Math.max(0, videos / maxVideos)) : 0;
  if (ratio >= 0.78) return '#B4142B';
  if (ratio >= 0.48) return '#CF2438';
  if (ratio >= 0.25) return '#E64655';
  if (ratio >= 0.1) return '#F26F78';
  return '#F7A1A6';
}

function mapFeatureName(row, isDrillMode) {
  return isDrillMode ? row.mapDataName || row.placeLabel : row.mapCountry;
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
      borderColor: 'rgba(255, 214, 214, 0.46)',
      borderWidth: 0.8
    },
    emphasis: {
      itemStyle: {
        areaColor: '#FF5964',
        borderColor: '#FFD1D4'
      }
    }
  };
}

function getCountryStats(period = centerPeriod) {
  const cacheKey = `country|${period}|${currentFilterKey()}`;
  if (geoStatsCache.has(cacheKey)) return geoStatsCache.get(cacheKey);
  const rows = normalizeData(getScopedVideoRows(period));
  const map = new Map();
  for (const row of rows) {
    const key = row.mapCountry || 'Unknown';
    if (!map.has(key)) {
      map.set(key, {
        placeKey: key,
        placeLabel: key,
        country: row.country,
        region: row.region,
        mapCountry: key,
        videos: 0,
        views: 0,
        creators: new Set(),
        topCreator: '-',
        topVideo: null,
        lat: REGION_LOCATION_FALLBACKS[row.region]?.lat || REGION_LOCATION_FALLBACKS[row.country]?.lat || null,
        lng: REGION_LOCATION_FALLBACKS[row.region]?.lng || REGION_LOCATION_FALLBACKS[row.country]?.lng || null
      });
    }
    const stat = map.get(key);
    stat.videos += 1;
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
  const geoPromise = isDrillMode ? ensureDrillGeo(mapDrillMode) : ensureWorldGeo();
  geoPromise.then((geoJson) => {
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
          return `<strong>${row.placeLabel}</strong><br/>上线视频：${centerNumber(row.videos)} 条<br/>7日声量：${centerNumber(row.views)}<br/>参与达人：${centerNumber(row.creatorsCount)} 位<br/>7日均播：${centerNumber(row.avgViews)}<br/>爆款达人：${escapeHtml(row.topCreator || '-')}<br/>爆款视频：${escapeHtml(top.videoTitle || top.creatorName || '-')}`;
        }
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxVideos,
        inRange: {
          color: ['#F7A1A6', '#F26F78', '#E64655', '#CF2438', '#B4142B']
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
          label: { show: false },
          itemStyle: {
            areaColor: '#0E1725',
            borderColor: 'rgba(255,255,255,.14)',
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
    <div><dt>7日声量</dt><dd>${centerNumber(active.views)}</dd></div>
    <div><dt>7日均播</dt><dd>${centerNumber(active.avgViews)}</dd></div>
  </dl>
  <div class="map-detail-top">
    <span>区域爆款</span>
    <strong>${externalLink(top.videoUrl, top.creatorName || active.topCreator || '-')}</strong>
    <small>${escapeHtml(top.platform || '-')} · ${shortDate(top.publishDate)} · ${centerNumber(top.views || 0)} 7日声量</small>
    <p>${escapeHtml(actionNote)}</p>
  </div>`;

  centerEls.globalRegionBars.innerHTML = rows
    .slice(0, 12)
    .map((row) => {
      const width = Math.max(6, Math.round((row.videos / maxVideos) * 100));
      const activeClass = row.placeKey === active.placeKey ? ' active' : '';
      const theme = mapThemeForRow(row);
      const precision = isDrillMode ? drillConfig.unitLabel : row.region || '国家';
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
    const views = sevenDayVideoViews(fields);
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
    const views = sevenDayVideoViews(fields);
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
    const views = sevenDayVideoViews(fields);
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
  if (centerEls.regionMissingNotice) {
    if (missing && missing.videos) {
      centerEls.regionMissingNotice.innerHTML = `当前时间范围有 <strong>${centerNumber(missing.videos)}</strong> 条视频缺少地区归因。请在红人库补充“地区/国家/市场”字段，地区看板会自动变准。`;
    } else {
      centerEls.regionMissingNotice.textContent = '地区字段已可用于当前时间范围的归因统计。';
    }
  }
  if (!rows.length) {
    centerEls.regionSummaryGrid.innerHTML = '<div class="empty-cell">当前时间暂无地区播放数据</div>';
    centerEls.regionLeaderboardGrid.innerHTML = '<div class="empty-cell">当前时间暂无地区榜单</div>';
    return;
  }
  const maxViews = Math.max(...rows.map((row) => row.views), 1);
  centerEls.regionSummaryGrid.innerHTML = rows
    .map((row, index) => {
      const width = Math.max(6, Math.round((row.views / maxViews) * 100));
      const top = row.topVideo;
      const topLabel = externalLink(top?.postUrl, top?.creator || '-');
      return `<article class="region-card" style="--delay:${index * 70}ms">
        <div class="region-card-head"><strong>${escapeHtml(row.region)}</strong><span>${row.share}% 7日声量占比</span></div>
        <div class="region-meter"><i style="width:${width}%"></i></div>
        <dl>
          <div><dt>7日声量</dt><dd>${centerNumber(row.views)}</dd></div>
          <div><dt>视频</dt><dd>${centerNumber(row.videos)} 条</dd></div>
          <div><dt>达人</dt><dd>${centerNumber(row.creatorsCount)} 位</dd></div>
          <div><dt>均播</dt><dd>${centerNumber(row.avgViews)}</dd></div>
        </dl>
        <p>爆款：${topLabel} · ${centerNumber(top?.views || 0)}</p>
      </article>`;
    })
    .join('');

  centerEls.regionLeaderboardGrid.innerHTML = rows
    .map((region) => {
      const list = region.videosList.slice(0, 5);
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
          <div><strong>${escapeHtml(region.region)}</strong><span>${centerNumber(region.views)} 7日声量 · ${centerNumber(region.videos)} 条视频</span></div>
          <em>Top ${Math.min(5, list.length)}</em>
        </div>
        <ol class="rank-list">${items}</ol>
      </article>`;
    })
    .join('');
}

function renderOwnerPerformance() {
  if (!centerEls.ownerSummaryGrid || !centerEls.ownerVideoGrid) return;
  const rows = getOwnerStats(centerPeriod);
  if (!rows.length) {
    centerEls.ownerSummaryGrid.innerHTML = '<div class="empty-cell">当前时间暂无负责人上线数据</div>';
    centerEls.ownerVideoGrid.innerHTML = '<div class="empty-cell">当前时间暂无视频明细</div>';
    return;
  }
  const maxViews = Math.max(...rows.map((row) => row.views), 1);
  centerEls.ownerSummaryGrid.innerHTML = rows
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
          <div><dt>7日声量</dt><dd>${centerNumber(row.views)}</dd></div>
          <div><dt>均播</dt><dd>${centerNumber(row.avgViews)}</dd></div>
        </dl>
        <p>爆款：${topLabel} · ${centerNumber(top?.views || 0)}</p>
      </article>`;
    })
    .join('');

  centerEls.ownerVideoGrid.innerHTML = rows
    .map((owner) => {
      const list = owner.videosList.slice(0, 8);
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
          <div><strong>${escapeHtml(owner.owner)}</strong><span>${centerNumber(owner.creatorsCount)} 位达人 · ${centerNumber(owner.videos)} 条视频 · ${centerNumber(owner.views)} 7日声量</span></div>
          <em>Top ${Math.min(8, list.length)}</em>
        </div>
        <ol class="rank-list">${items}</ol>
      </article>`;
    })
    .join('');
}

function renderHotVideoBubbles() {
  if (!centerEls.hotVideoBubbleChart) return;
  const rows = getScopedVideoLeaderboard(centerPeriod).slice(0, 10);
  if (!rows.length) {
    centerEls.hotVideoBubbleChart.innerHTML = '<div class="empty-cell">暂无爆款视频数据</div>';
    return;
  }
  const maxViews = Math.max(...rows.map((row) => rawNumber(row.views)), 1);
  centerEls.hotVideoBubbleChart.innerHTML = rows
    .map((row, index) => {
      const views = rawNumber(row.views);
      const width = Math.max(8, Math.round((views / maxViews) * 100));
      const content = `<span>#${row.rank || index + 1}</span>
        <div><strong>${centerNumber(views)}</strong><small>${escapeHtml(row.creator || '-')} · ${escapeHtml(shortPlatformName(row.platform))}</small></div>
        <i><b style="width:${width}%"></b></i>`;
      const attrs = `class="bubble-node platform-${platformClass(row.platform)}" style="--delay:${index * 70}ms" title="${escapeHtml(row.platform || '')} · ${escapeHtml(row.creator || '')}"`;
      const safeUrl = safeExternalUrl(row.postUrl);
      return safeUrl
        ? `<a ${attrs} href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${content}</a>`
        : `<div ${attrs}>${content}</div>`;
    })
    .join('');
}

function renderDonutChart(target, rows) {
  const data = Array.isArray(rows) ? rows.filter((row) => row.count > 0) : [];
  if (!target || !data.length) {
    if (target) target.innerHTML = '<div class="empty-cell">暂无平台数据</div>';
    return;
  }
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const top = data[0];
  const list = data
    .slice(0, 5)
    .map((row) => {
      const percent = Math.round((row.count / total) * 100);
      return `<article class="platform-brief-row platform-${platformClass(row.platform)}">
        <div><strong>${escapeHtml(shortPlatformName(row.platform))}</strong><span>${centerNumber(row.count)} 条 · ${percent}%</span></div>
        <i><b style="width:${Math.max(4, percent)}%"></b></i>
      </article>`;
    })
    .join('');
  target.innerHTML = `<div class="platform-brief-total">
    <span>当前结构</span>
    <strong>${centerNumber(total)} 条</strong>
    <small>主平台：${escapeHtml(shortPlatformName(top.platform))} · ${Math.round((top.count / total) * 100)}%</small>
  </div>
  <div class="platform-brief-list">${list}</div>`;
}

function renderWeeklyPulse() {
  const rows = getWeeklyTrendRows();
  if (!centerEls.weeklyPulseGrid) return;
  if (!rows.length) {
    centerEls.weeklyPulseGrid.innerHTML = '<div class="empty-cell">暂无每周视频数据</div>';
    return;
  }
  const maxViews = Math.max(...rows.map((row) => Number(row.mature7dViews ?? row.views) || 0), 1);
  centerEls.weeklyPulseGrid.innerHTML = rows
    .map((row, index) => {
      const previous = rows[index - 1] || {};
      const views = Number(row.mature7dViews ?? row.views) || 0;
      const videos = Number(row.videos) || 0;
      const creators = Number(row.creators) || 0;
      const prevViews = Number(previous.mature7dViews ?? previous.views) || 0;
      const delta = index === 0 ? 0 : views - prevViews;
      const deltaText = index === 0 ? '基准周' : `${delta >= 0 ? '+' : ''}${centerNumber(delta)}`;
      const intensity = Math.max(10, Math.round((views / maxViews) * 100));
      return `<article class="weekly-pulse-card" style="--pulse:${intensity}%">
        <span>${shortDate(row.weekStart)} - ${shortDate(row.weekEnd)}</span>
        <strong>${centerNumber(videos)} 条</strong>
        <dl>
          <div><dt>达人</dt><dd>${centerNumber(creators)}</dd></div>
          <div><dt>7日声量</dt><dd>${centerNumber(views)}</dd></div>
          <div><dt>环比</dt><dd class="${delta >= 0 ? 'up' : 'down'}">${deltaText}</dd></div>
        </dl>
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
            `<li><span>${index + 1}</span><div><strong>${escapeHtml(row.creator || '-')}</strong><small>${centerNumber(row.views)} 7日声量 · ${centerNumber(row.videos)} 条视频</small></div><b>${centerNumber(row.avgViews)}</b></li>`
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
      : `当前导入的 affiliate CSV 是联盟账号资料，暂未包含订单数、销售额、佣金字段；已完成 email 匹配，先用于查看“哪些联盟达人有视频 7 日声量”。`;
  }

  centerEls.affiliateSalesKpis.innerHTML = [
    ['联盟账号', `${centerNumber(rows.length)} 条`, '四个 CSV 合并去重'],
    ['Email 匹配', `${centerNumber(matched)} 条`, `${centerNumber(rows.length - matched)} 条未匹配`],
    ['有声量达人', `${centerNumber(activeRows.length)} 条`, `${centerNumber(totalViews)} 7日声量`],
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

function renderDashboardCharts() {
  renderCommandKpis();
  renderLineChart(centerEls.weeklyTrendChart, getWeeklyTrendRows(), 'videos', 'mature7dViews');
  renderBarChart(centerEls.monthlyBarChart, getMonthlyTrendRows());
  renderDonutChart(centerEls.platformPieChart, getPlatformDistribution(centerPeriod));
  renderOpsCommandCenter();
  renderActivityHeatmap();
  renderGlobalMap();
  renderPlatformOrbit();
  renderOpsMonitor();
  renderBattleInsights();
  renderWeeklyPulse();
  renderPlatformMatrix();
  renderRegionPerformance();
  renderOwnerPerformance();
  renderAffiliateSalesDashboard();
  renderLeaderboards();
  renderHotVideoBubbles();
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
        <dt>7日声量</dt><dd>${centerNumber(tier.views)}</dd>
        <dt>7日均播</dt><dd>${centerNumber(tier.avgViews)}</dd>
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
    const views = sevenDayVideoViews(fields);
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
      const rows = tier.creators.slice(0, 5);
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
  renderCustomSummaryCard();
  renderCurrentPeriod();
  renderBattleInsights();
  renderLineChart(centerEls.weeklyTrendChart, getWeeklyTrendRows(), 'videos', 'mature7dViews');
  renderBarChart(centerEls.monthlyBarChart, getMonthlyTrendRows());
  renderDonutChart(centerEls.platformPieChart, getPlatformDistribution(centerPeriod));
  renderPlatformOrbit();
  renderPlatformMatrix();
  renderGlobalMap();
  renderRegionPerformance();
  renderOwnerPerformance();
  renderAffiliateSalesDashboard();
  renderLeaderboards();
  renderHotVideoBubbles();
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
  const ownerByCreator = getOwnerByCreator();
  const regionByCreator = getRegionByCreator();
  const rows = getScopedVideoRows(centerPeriod)
    .map((fields) => {
      const views = sevenDayVideoViews(fields);
      const likes = rawNumber(fields.likesCount);
      const comments = rawNumber(fields.commentsCount);
      return {
        负责人: getVideoOwner(fields, ownerByCreator),
        地区: getVideoRegion(fields, regionByCreator),
        红人名称: readLocalText(fields['红人名称']) || '',
        平台: platformLabel(readLocalText(fields['平台'])),
        上线时间: fields.timestamp || '',
        '7日声量': views,
        点赞数: likes,
        评论数: comments,
        互动率: views ? `${Number((((likes + comments) / views) * 100).toFixed(2))}%` : '0%',
        视频链接: videoUrl(fields),
        文案: readLocalText(fields.caption)
      };
    })
    .sort((a, b) => Number(b['7日声量']) - Number(a['7日声量']));
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

function renderTables() {
  clearRows(centerEls.influencerRows);
  const influencerHelpers = getDashboardHelpers();
  getScopedInfluencerRows().slice(0, 300).forEach((fields) => {
    const normalized = normalizeInfluencerRow(fields, influencerHelpers);
    const tr = document.createElement('tr');
    addCell(tr, normalized.creatorName);
    addCell(tr, normalized.owner || '-');
    addCell(tr, normalized.region || '-');
    addCell(tr, normalized.platform);
    const linkCell = addCell(tr, readLocalLink(fields['红人链接']));
    addCell(tr, readLocalText(fields['是否监控']));
    addCell(tr, readLocalText(fields['是否出视频'] || fields['是否发布视频']));
    centerEls.influencerRows.appendChild(tr);
  });

  clearRows(centerEls.videoRows);
  const search = String(centerEls.videoTableSearch?.value || '').trim().toLowerCase();
  normalizeData(getScopedVideoRows(centerPeriod))
    .filter((row) => {
      if (!search) return true;
      return [row.creatorName, row.platform, row.owner, row.region, row.videoTitle].some((value) => String(value || '').toLowerCase().includes(search));
    })
    .sort((a, b) => b.views - a.views || (b.publishDate?.getTime?.() || 0) - (a.publishDate?.getTime?.() || 0))
    .slice(0, 300)
    .forEach((row) => {
      const tr = document.createElement('tr');
      addCell(tr, row.creatorName);
      addCell(tr, row.owner);
      addCell(tr, row.region);
      addCell(tr, row.platform);
      addCell(tr, centerDate(row.publishDate));
      addCell(tr, centerNumber(row.views));
      addCell(tr, `${row.engagementRate}%`);
      const status = videoStatus(row);
      const statusCell = document.createElement('td');
      statusCell.innerHTML = `<span class="status-pill ${escapeHtml(status.level)}">${escapeHtml(status.label)}</span>`;
      tr.appendChild(statusCell);
      const url = row.videoUrl;
      const linkCell = document.createElement('td');
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
      centerEls.videoRows.appendChild(tr);
    });

  clearRows(centerEls.affiliateSalesRows);
  getAffiliateSalesAnalysis(centerPeriod)
    .slice(0, 400)
    .forEach((row) => {
      const tr = document.createElement('tr');
      addCell(tr, row.creator || row.affiliateName || '-');
      addCell(tr, row.email || '-');
      addCell(tr, row.owner || '-');
      addCell(tr, row.region || '-');
      const codeCell = document.createElement('td');
      const safeLink = safeExternalUrl(row.referralLink);
      codeCell.innerHTML = safeLink
        ? `<a href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.referralCode || '打开')}</a>`
        : escapeHtml(row.referralCode || '-');
      tr.appendChild(codeCell);
      addCell(tr, row.matchStatus === 'email_matched' ? `已匹配 / ${row.status}` : `未匹配 / ${row.status}`);
      addCell(tr, `${centerNumber(row.videos)} 条`);
      addCell(tr, centerNumber(row.views));
      addCell(tr, row.hasOrderMetrics ? centerNumber(row.orders) : '0');
      addCell(tr, row.hasOrderMetrics ? moneyBreakdownText(row.revenueByCurrency) : '0');
      addCell(tr, row.hasOrderMetrics ? moneyBreakdownText(row.commissionByCurrency) : '0');
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
      addCell(tr, centerDate(fields.capturedAt));
      addCell(tr, readLocalText(fields['红人名称']));
      addCell(tr, readLocalText(fields.platform));
      addCell(tr, centerNumber(Math.max(Number(fields.videoPlayCount) || 0, Number(fields.videoViewCount) || 0)));
      addCell(tr, readLocalText(fields.snapshotType));
      centerEls.snapshotRows.appendChild(tr);
    });

  clearRows(centerEls.runRows);
  (centerStore.runs || []).slice(0, 300).forEach((row) => {
    const fields = row.fields || row;
    const tr = document.createElement('tr');
    addCell(tr, centerDate(fields.createdAt || fields.time));
    addCell(tr, readLocalText(fields.task || fields.name));
    addCell(tr, readLocalText(fields.status));
    addCell(tr, readLocalText(fields.message || fields.note));
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
    globalKeywords: centerEls.localDiscoverKeywords.value || 'yozma,yozmasport'
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
    return `候选检查完成：本地红人 ${audit.totalRows || 0} 条，可抓取 ${audit.eligibleRows || 0} 条，本次队列 ${audit.queuedRows || 0} 条，Apify 预估约 $${Number(estimate.estimatedUsageUsd || 0).toFixed(2)}。`;
  }
  const summary = data.summary || {};
  return `本地抓取完成：处理 ${data.processedInfluencers || 0} 位，新增视频 ${summary.videoCreated || 0} 条，跳过重复 ${summary.videoSkipped || 0} 条，快照 ${summary.snapshotCreated || 0} 条，Apify 约 $${Number(summary.usageUsd || 0).toFixed(3)}。`;
}

function renderApifyEstimate(data) {
  if (!centerEls.apifyEstimateBox) return;
  const audit = data.candidateAudit || {};
  const estimate = data.usageEstimate || {};
  const platformRows = Object.entries(estimate.byPlatform || {})
    .map(([platform, row]) => `<span>${escapeHtml(platform)}：${row.count} 位，约 $${Number(row.estimatedUsd || 0).toFixed(2)}</span>`)
    .join('');
  centerEls.apifyEstimateBox.innerHTML = `
    <strong>本次候选：${audit.queuedRows || 0} 位，Apify 预估约 $${Number(estimate.estimatedUsageUsd || 0).toFixed(2)}</strong>
    <p>${escapeHtml(estimate.estimateBasis || '真实费用以 Apify 返回为准。')}</p>
    <div>${platformRows || '<span>暂无候选</span>'}</div>`;
}

async function loadCenter() {
  centerEls.status.textContent = isStaticCenter ? '正在加载团队只读快照...' : '正在加载本地中台数据...';
  const [collections, dashboard, creatorLocations] = await Promise.all([
    centerRequest('/api/local/collections'),
    centerRequest('/api/local/dashboard?weeks=8'),
    loadCreatorLocations()
  ]);
  centerStore = collections.collections || {};
  centerStore.creatorLocations = creatorLocations || { locations: [] };
  centerDashboard = dashboard.dashboard || {};
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

const DASHBOARD_INTERACTION_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  '.center-nav',
  '.period-card',
  '.battle-card',
  '.trend-card',
  '.monitor-card',
  '.situation-card',
  '.global-map-card',
  '.global-detail-card',
  '.global-bars-card',
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
  let cursorGlow = null;

  if (pointerFine) {
    cursorGlow = document.createElement('div');
    cursorGlow.className = 'dashboard-cursor-glow';
    document.body.appendChild(cursorGlow);

    document.addEventListener('pointermove', (event) => {
      const target = event.target.closest(DASHBOARD_INTERACTION_SELECTOR);
      if (!target || !dashboardRoot?.contains(target)) {
        cursorGlow.classList.remove('active');
        return;
      }
      cursorGlow.style.transform = `translate3d(${event.clientX - 85}px, ${event.clientY - 85}px, 0)`;
      cursorGlow.classList.add('active');
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      cursorGlow.classList.remove('active');
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

document.querySelectorAll('[data-dashboard-jump]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.dashboardJump);
    if (target) {
      scrollToCenterTarget(target);
    }
  });
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
