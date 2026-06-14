import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKBOOK_PATH = process.argv[2] || '/Users/ryan/Downloads/Yozma-红人营销总表 (3).xlsx';
const INFLUENCERS_PATH = path.join(ROOT, 'data/local/influencers.json');
const VIDEOS_PATH = path.join(ROOT, 'data/local/videos.json');
const REPORT_DIR = path.join(ROOT, 'data/reports');

const COOP_START = new Date('2026-02-01T00:00:00+08:00');
const COOP_END_EXCLUSIVE = new Date('2026-03-01T00:00:00+08:00');
const VIDEO_START = new Date('2026-05-01T00:00:00+08:00');
const VIDEO_END_EXCLUSIVE = new Date('2026-06-12T00:00:00+08:00');
const TODAY = '2026-06-14';

function cellText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (typeof value === 'object') return String(value.text || value.name || value.value || value.link || '').trim();
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

function extractMatchKeysFromUrl(value) {
  const raw = cellText(value);
  if (!raw || !/^https?:\/\//i.test(raw)) return [];
  const keys = [];
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    if (host.includes('tiktok.com')) {
      const handle = parts.find((part) => part.startsWith('@'));
      if (handle) keys.push(normalizeName(handle));
    }
    if (host.includes('instagram.com')) {
      const blocked = new Set(['p', 'reel', 'reels', 'tv', 'stories']);
      const handle = parts.find((part) => !blocked.has(part.toLowerCase()));
      if (handle) keys.push(normalizeName(handle));
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const atHandle = parts.find((part) => part.startsWith('@'));
      if (atHandle) keys.push(normalizeName(atHandle));
      const channelLike = parts.find((part, index) => ['channel', 'c', 'user'].includes((parts[index - 1] || '').toLowerCase()));
      if (channelLike) keys.push(normalizeName(channelLike));
    }
  } catch {}
  return [...new Set(keys.filter(Boolean))];
}

function headerKey(header) {
  const text = cellText(header).toLowerCase();
  if (/^合作日期$|合作时间|寄样时间|date|year/.test(text)) return 'date';
  if (/^名字$|姓名|昵称|红人名称|达人名称|kol名称|influencer name|creator name|账号名称|账号名|name/.test(text)) return 'name';
  if (/链接|主页|profile|url|link|账号链接/.test(text)) return 'link';
  if (/平台|platform/.test(text)) return 'platform';
  return '';
}

function findHeaderRow(rows) {
  let best = { index: 0, score: 0 };
  rows.slice(0, 20).forEach((row, index) => {
    const joined = row.map(cellText).join('|').toLowerCase();
    let score = 0;
    if (/合作日期|合作时间|date/.test(joined)) score += 4;
    if (/红人|达人|kol|influencer|名字|name/.test(joined)) score += 3;
    if (/链接|主页|url|link/.test(joined)) score += 2;
    if (score > best.score) best = { index, score };
  });
  return best.index;
}

async function getWorksheetRows(workbook) {
  const sheetInfo = await workbook.inspect({ kind: 'sheet', include: 'id,name', maxChars: 20000 });
  const sheetNames = [];
  for (const line of sheetInfo.ndjson.trim().split(/\n+/)) {
    try {
      const item = JSON.parse(line);
      if (item.name) sheetNames.push(item.name);
    } catch {}
  }
  return sheetNames.map((sheetName) => {
    const sheet = workbook.worksheets.getItem(sheetName);
    const used = sheet.getUsedRange(true);
    return { sheetName, rows: used?.values || [] };
  });
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

const input = await FileBlob.load(WORKBOOK_PATH);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheets = await getWorksheetRows(workbook);

const febCreators = new Map();
for (const sheet of sheets) {
  if (!sheet.rows.length) continue;
  const headerRow = findHeaderRow(sheet.rows);
  const headers = sheet.rows[headerRow] || [];
  const mapped = headers.map(headerKey);
  for (let index = headerRow + 1; index < sheet.rows.length; index += 1) {
    const row = sheet.rows[index] || [];
    let name = '';
    let date = null;
    const links = [];
    const raw = {};
    headers.forEach((header, cellIndex) => {
      const label = cellText(header);
      const value = cellText(row[cellIndex]);
      if (label && value) raw[label] = value;
      const key = mapped[cellIndex];
      if (key === 'name' && !name) name = value;
      if (key === 'date' && !date) date = parseDate(value);
      if (key === 'link' && value) links.push(value);
    });
    if (!date || date < COOP_START || date >= COOP_END_EXCLUSIVE) continue;
    const keys = new Set([normalizeName(name), ...links.flatMap(extractMatchKeysFromUrl)].filter(Boolean));
    if (!keys.size) continue;
    const mainKey = normalizeName(name) || [...keys][0];
    if (!febCreators.has(mainKey)) {
      febCreators.set(mainKey, {
        name: cellText(name) || mainKey,
        cooperationDate: date.toISOString().slice(0, 10),
        sheetName: sheet.sheetName,
        rowNumbers: [],
        links: new Set(),
        keys: new Set(),
      });
    }
    const item = febCreators.get(mainKey);
    item.rowNumbers.push(index + 1);
    links.forEach((link) => item.links.add(link));
    keys.forEach((key) => item.keys.add(key));
  }
}

const influencers = JSON.parse(await fs.readFile(INFLUENCERS_PATH, 'utf8'));
const videos = JSON.parse(await fs.readFile(VIDEOS_PATH, 'utf8'));

const recentVideoByKey = new Map();
for (const video of videos) {
  const fields = video.fields || {};
  const publishedAt = parseDate(fields.timestamp || fields.publishedAt || fields.publishDate || fields.date);
  if (!publishedAt || publishedAt < VIDEO_START || publishedAt >= VIDEO_END_EXCLUSIVE) continue;
  const keys = new Set([
    normalizeName(fields['红人名称'] || fields.creatorName || fields.author || fields.username),
    ...extractMatchKeysFromUrl(fields.url || fields.videoUrl || fields['视频链接']),
  ].filter(Boolean));
  for (const key of keys) {
    const current = recentVideoByKey.get(key) || { count: 0, latestAt: null, platforms: new Set() };
    current.count += 1;
    if (!current.latestAt || publishedAt > current.latestAt) current.latestAt = publishedAt;
    current.platforms.add(cellText(fields['平台'] || fields.platform));
    recentVideoByKey.set(key, current);
  }
}

function influencerKeys(fields) {
  return new Set([
    normalizeName(fields['红人名称']),
    ...extractMatchKeysFromUrl(fields['红人链接']),
  ].filter(Boolean));
}

function findFebCreatorForInfluencer(fields) {
  const keys = influencerKeys(fields);
  for (const creator of febCreators.values()) {
    for (const key of creator.keys) {
      if (keys.has(key)) return creator;
    }
  }
  return null;
}

function findRecentForCreator(creator) {
  for (const key of creator.keys) {
    const recent = recentVideoByKey.get(key);
    if (recent?.count) return recent;
  }
  return null;
}

const now = new Date().toISOString();
const reviewedRows = [];
const changedRows = [];

for (const influencer of influencers) {
  const fields = influencer.fields || {};
  const creator = findFebCreatorForInfluencer(fields);
  if (!creator) continue;
  const recent = findRecentForCreator(creator);
  const hasRecentVideo = Boolean(recent?.count);
  const isMonitoring = cellText(fields['是否监控']) !== '否';
  const row = {
    id: influencer.id || '',
    name: cellText(fields['红人名称']),
    cooperationName: creator.name,
    cooperationDate: creator.cooperationDate,
    platform: cellText(fields['平台']),
    owner: cellText(fields['负责人']),
    region: cellText(fields['地区']),
    influencerCode: cellText(fields['红人编码']),
    link: cellText(fields['红人链接']),
    hadVideo_2026_05_01_to_06_11: hasRecentVideo ? '是' : '否',
    recentVideoCount: recent?.count || 0,
    recentPlatforms: recent ? [...recent.platforms].filter(Boolean).join(' / ') : '',
    latestRecentVideoAt: recent?.latestAt?.toISOString() || '',
    previousMonitor: cellText(fields['是否监控']),
    newMonitor: hasRecentVideo ? cellText(fields['是否监控']) : '否',
    action: hasRecentVideo ? '保留原状态' : (isMonitoring ? '已设为不监控' : '原本已不监控'),
    reason: hasRecentVideo
      ? '2026年2月合作，但 2026-05-01 至 2026-06-11 有视频记录'
      : '2026年2月合作，2026-05-01 至 2026-06-11 未发现视频上线记录，停止普通监控节省抓取成本',
  };
  reviewedRows.push(row);
  if (!hasRecentVideo && isMonitoring) {
    fields['是否监控'] = '否';
    fields['监控排除原因'] = '2026年2月合作且5月-6/11未发视频，不再追踪';
    fields['监控排除依据'] = '营销总表合作日期=2026年2月；本地视频表2026-05-01至2026-06-11无上线记录';
    fields['监控排除时间'] = TODAY;
    influencer.updatedAt = now;
    changedRows.push(row);
  }
}

await fs.mkdir(REPORT_DIR, { recursive: true });
const stamp = TODAY.replaceAll('-', '');
const backupPath = path.join(ROOT, `data/local/influencers.backup-before-2026-feb-no-recent-video-rule-${stamp}.json`);
await fs.copyFile(INFLUENCERS_PATH, backupPath);
await fs.writeFile(INFLUENCERS_PATH, `${JSON.stringify(influencers, null, 2)}\n`);

const headers = [
  'id',
  'name',
  'cooperationName',
  'cooperationDate',
  'platform',
  'owner',
  'region',
  'influencerCode',
  'link',
  'hadVideo_2026_05_01_to_06_11',
  'recentVideoCount',
  'recentPlatforms',
  'latestRecentVideoAt',
  'previousMonitor',
  'newMonitor',
  'action',
  'reason',
];
const reportPath = path.join(REPORT_DIR, `monitor-disabled-2026-feb-no-recent-videos-${stamp}.csv`);
const reviewedPath = path.join(REPORT_DIR, `monitor-reviewed-2026-feb-recent-video-rule-${stamp}.csv`);
const jsonPath = path.join(REPORT_DIR, `monitor-disabled-2026-feb-no-recent-videos-${stamp}.json`);

await fs.writeFile(reportPath, `${toCsv(changedRows, headers)}\n`);
await fs.writeFile(reviewedPath, `${toCsv(reviewedRows, headers)}\n`);
await fs.writeFile(jsonPath, `${JSON.stringify({
  generatedAt: now,
  workbookPath: WORKBOOK_PATH,
  rule: {
    cooperationStart: COOP_START.toISOString(),
    cooperationEndExclusive: COOP_END_EXCLUSIVE.toISOString(),
    recentVideoWindowStart: VIDEO_START.toISOString(),
    recentVideoWindowEndExclusive: VIDEO_END_EXCLUSIVE.toISOString(),
  },
  totals: {
    feb2026Creators: febCreators.size,
    reviewedInfluencerRows: reviewedRows.length,
    changedToNotMonitor: changedRows.length,
    keptBecauseHadRecentVideo: reviewedRows.filter((row) => row.hadVideo_2026_05_01_to_06_11 === '是').length,
    alreadyNotMonitoring: reviewedRows.filter((row) => row.action === '原本已不监控').length,
  },
  files: { backupPath, reportPath, reviewedPath },
}, null, 2)}\n`);

console.log(JSON.stringify({
  feb2026Creators: febCreators.size,
  reviewedInfluencerRows: reviewedRows.length,
  changedToNotMonitor: changedRows.length,
  reportPath,
  reviewedPath,
  backupPath,
}, null, 2));
