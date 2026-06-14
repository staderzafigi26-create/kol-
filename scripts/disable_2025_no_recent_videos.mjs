import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INFLUENCERS_PATH = path.join(ROOT, 'data/local/influencers.json');
const VIDEOS_PATH = path.join(ROOT, 'data/local/videos.json');
const AUDIT_PATH = path.join(ROOT, 'data/reports/cooperation-video-audit.json');
const REPORT_DIR = path.join(ROOT, 'data/reports');

const RANGE_START = new Date('2026-05-01T00:00:00+08:00');
const RANGE_END_EXCLUSIVE = new Date('2026-06-12T00:00:00+08:00');
const TODAY = '2026-06-14';

function cellText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (typeof value === 'object') return String(value.text || value.link || value.url || '').trim();
  return String(value).trim();
}

function normalizeName(value) {
  return cellText(value)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/https?:\/\/[^/]+\/@?/, '')
    .replace(/[?/#].*$/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function parseDate(value) {
  const text = cellText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, headers) {
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');
}

const influencers = JSON.parse(await fs.readFile(INFLUENCERS_PATH, 'utf8'));
const videos = JSON.parse(await fs.readFile(VIDEOS_PATH, 'utf8'));
const audit = JSON.parse(await fs.readFile(AUDIT_PATH, 'utf8'));

const cooperation2025 = new Map();
for (const row of audit.monitoringPreAuditRows || []) {
  if (Number(row.latestYear) !== 2025) continue;
  const key = normalizeName(row.name);
  if (!key) continue;
  const existing = cooperation2025.get(key);
  if (!existing) {
    cooperation2025.set(key, {
      name: row.name,
      latestYear: row.latestYear,
      cooperationPublishedSignal: row.cooperationPublishedSignal || '',
      salesSignal: row.salesSignal || '',
      auditLocalVideoCount: Number(row.localVideoCount || 0),
      auditLatestVideoAt: row.latestVideoAt || '',
    });
  }
}

const recentVideoByCreator = new Map();
for (const video of videos) {
  const fields = video.fields || {};
  const key = normalizeName(fields['红人名称'] || fields.creatorName || fields.author || fields.username);
  if (!key) continue;
  const publishedAt = parseDate(fields.timestamp || fields.publishedAt || fields.publishDate || fields.date);
  if (!publishedAt || publishedAt < RANGE_START || publishedAt >= RANGE_END_EXCLUSIVE) continue;
  const current = recentVideoByCreator.get(key) || { count: 0, latestAt: null, platforms: new Set() };
  current.count += 1;
  if (!current.latestAt || publishedAt > current.latestAt) current.latestAt = publishedAt;
  current.platforms.add(cellText(fields['平台'] || fields.platform));
  recentVideoByCreator.set(key, current);
}

const now = new Date().toISOString();
const changedRows = [];
const reviewedRows = [];

for (const influencer of influencers) {
  const fields = influencer.fields || {};
  const key = normalizeName(fields['红人名称']);
  if (!key || !cooperation2025.has(key)) continue;
  const cooperation = cooperation2025.get(key);
  const recent = recentVideoByCreator.get(key);
  const hasRecentVideo = Boolean(recent && recent.count > 0);
  const isMonitoring = cellText(fields['是否监控']) !== '否';
  const row = {
    id: influencer.id || '',
    name: cellText(fields['红人名称']),
    platform: cellText(fields['平台']),
    owner: cellText(fields['负责人']),
    region: cellText(fields['地区']),
    influencerCode: cellText(fields['红人编码']),
    link: cellText(fields['红人链接']),
    latestYear: cooperation.latestYear,
    hadVideo_2026_05_01_to_06_11: hasRecentVideo ? '是' : '否',
    recentVideoCount: recent?.count || 0,
    recentPlatforms: recent ? [...recent.platforms].filter(Boolean).join(' / ') : '',
    latestRecentVideoAt: recent?.latestAt?.toISOString() || '',
    previousMonitor: cellText(fields['是否监控']),
    newMonitor: hasRecentVideo ? cellText(fields['是否监控']) : '否',
    action: hasRecentVideo ? '保留原状态' : (isMonitoring ? '已设为不监控' : '原本已不监控'),
    reason: hasRecentVideo
      ? '2025合作，但 2026-05-01 至 2026-06-11 有视频记录'
      : '2025合作，2026-05-01 至 2026-06-11 未发现视频上线记录，停止普通监控节省抓取成本',
  };
  reviewedRows.push(row);
  if (!hasRecentVideo && isMonitoring) {
    fields['是否监控'] = '否';
    fields['监控排除原因'] = '2025合作且5月-6/11未发视频，不再追踪';
    fields['监控排除依据'] = '合作名单最近年份=2025；本地视频表2026-05-01至2026-06-11无上线记录';
    fields['监控排除时间'] = TODAY;
    influencer.updatedAt = now;
    changedRows.push(row);
  }
}

await fs.mkdir(REPORT_DIR, { recursive: true });
const backupPath = path.join(ROOT, `data/local/influencers.backup-before-2025-no-recent-video-rule-${TODAY.replaceAll('-', '')}.json`);
await fs.copyFile(INFLUENCERS_PATH, backupPath);
await fs.writeFile(INFLUENCERS_PATH, `${JSON.stringify(influencers, null, 2)}\n`);

const headers = [
  'id',
  'name',
  'platform',
  'owner',
  'region',
  'influencerCode',
  'link',
  'latestYear',
  'hadVideo_2026_05_01_to_06_11',
  'recentVideoCount',
  'recentPlatforms',
  'latestRecentVideoAt',
  'previousMonitor',
  'newMonitor',
  'action',
  'reason',
];
const reportPath = path.join(REPORT_DIR, `monitor-disabled-2025-no-recent-videos-${TODAY.replaceAll('-', '')}.csv`);
const reviewedPath = path.join(REPORT_DIR, `monitor-reviewed-2025-recent-video-rule-${TODAY.replaceAll('-', '')}.csv`);
const jsonPath = path.join(REPORT_DIR, `monitor-disabled-2025-no-recent-videos-${TODAY.replaceAll('-', '')}.json`);

await fs.writeFile(reportPath, `${toCsv(changedRows, headers)}\n`);
await fs.writeFile(reviewedPath, `${toCsv(reviewedRows, headers)}\n`);
await fs.writeFile(jsonPath, `${JSON.stringify({
  generatedAt: now,
  rule: {
    cooperationYear: 2025,
    recentVideoWindowStart: RANGE_START.toISOString(),
    recentVideoWindowEndExclusive: RANGE_END_EXCLUSIVE.toISOString(),
  },
  totals: {
    cooperation2025Creators: cooperation2025.size,
    reviewedInfluencerRows: reviewedRows.length,
    changedToNotMonitor: changedRows.length,
    keptBecauseHadRecentVideo: reviewedRows.filter((row) => row.hadVideo_2026_05_01_to_06_11 === '是').length,
    alreadyNotMonitoring: reviewedRows.filter((row) => row.action === '原本已不监控').length,
  },
  files: { backupPath, reportPath, reviewedPath },
}, null, 2)}\n`);

console.log(JSON.stringify({
  changedToNotMonitor: changedRows.length,
  reviewedInfluencerRows: reviewedRows.length,
  cooperation2025Creators: cooperation2025.size,
  reportPath,
  reviewedPath,
  backupPath,
}, null, 2));
