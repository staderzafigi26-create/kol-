import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_DIR = path.join(ROOT, 'data', 'local');
const REPORT_DIR = path.join(ROOT, 'data', 'reports');
const marketingPath = process.argv[2] || '/Users/ryan/Downloads/Yozma-红人营销总表 (5).xlsx';
const contractPath = process.argv[3] || '/Users/ryan/Downloads/Yozma-红人合同签署表 (2).xlsx';
const REPORT_START = new Date('2026-06-06T00:00:00+08:00');
const REPORT_END = new Date('2026-06-13T00:00:00+08:00');
const COOP_WRITE_FIELDS = [
  '合作日期',
  '合作进度',
  '合作模式',
  '合作车型',
  '合作周期',
  '合作量级',
  '合作服务',
  '合同签署日期',
  '合同类型',
  '合同金额',
  '预计视频交付',
  '已上线视频',
  '待补视频交付',
  '视频交付完成率',
  '合同交付平台拆分',
  '合同交付解析状态',
  '合同交付摘要'
];

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') return String(value.text || value.name || value.value || value.link || '').trim();
  return String(value).replace(/\uFEFF/g, '').trim();
}

function compact(value) {
  return text(value).replace(/\s+/g, ' ').trim();
}

function norm(value) {
  return compact(value)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[，,。./\\|:：;；()[\]{}'"“”‘’\s_-]+/g, '');
}

function stableId(prefix, value) {
  let hash = 0;
  const raw = String(value || '');
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return `${prefix}_${hash.toString(36)}`;
}

function csvEscape(value) {
  const output = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(output) ? `"${output.replace(/"/g, '""')}"` : output;
}

async function writeCsv(filePath, rows, headers) {
  const lines = [headers.join(',')].concat(rows.map((row) => headers.map((key) => csvEscape(row[key])).join(',')));
  await fs.writeFile(filePath, `\uFEFF${lines.join('\n')}\n`, 'utf8');
}

async function readJson(name) {
  try {
    return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, `${name}.json`), 'utf8'));
  } catch {
    return [];
  }
}

async function writeJson(name, rows) {
  await fs.writeFile(path.join(LOCAL_DIR, `${name}.json`), JSON.stringify(rows, null, 2), 'utf8');
}

async function worksheetRows(workbookPath) {
  const input = await FileBlob.load(workbookPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const info = await workbook.inspect({ kind: 'sheet', include: 'id,name', maxChars: 20000 });
  const names = [];
  for (const line of info.ndjson.trim().split(/\n+/)) {
    try {
      const item = JSON.parse(line);
      if (item.name) names.push(item.name);
    } catch {}
  }
  return names.map((name) => {
    const sheet = workbook.worksheets.getItem(name);
    return { sheetName: name, rows: sheet.getUsedRange(true)?.values || [] };
  });
}

function rowObject(headers, row) {
  const output = {};
  headers.forEach((header, index) => {
    const key = compact(header);
    if (key) output[key] = row[index];
  });
  return output;
}

function findHeaderRow(rows, required = []) {
  let best = { index: 0, score: 0 };
  rows.slice(0, 20).forEach((row, index) => {
    const joined = row.map(text).join('|').toLowerCase();
    let score = 0;
    for (const token of required) if (joined.includes(token.toLowerCase())) score += 3;
    if (/红人|达人|名字|kol|influencer|creator/.test(joined)) score += 3;
    if (/合作|合同|签署|盖章|交付|视频|平台/.test(joined)) score += 2;
    if (/链接|主页|url|tiktok|youtube|instagram/.test(joined)) score += 2;
    if (score > best.score) best = { index, score };
  });
  return best.index;
}

function dateValue(value) {
  const raw = text(value);
  if (!raw) return '';
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  const match = raw.match(/(20\d{2})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  return raw.slice(0, 20);
}

function readLink(value) {
  if (value && typeof value === 'object') return text(value.link || value.text || value.value);
  return text(value);
}

function splitLinks(value) {
  return [...new Set(text(value).match(/https?:\/\/[^\s，,；;）)]+/gi) || [])];
}

function linkCell(url) {
  const value = text(url);
  return value ? { text: value, link: value } : '';
}

function normalizeProfileUrl(value) {
  const raw = readLink(value);
  if (!raw || !/^https?:\/\//i.test(raw)) return '';
  try {
    const url = new URL(raw);
    url.hash = '';
    url.search = '';
    const parts = url.pathname.split('/').filter(Boolean);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('instagram.com')) url.pathname = `/${parts[0] || ''}`;
    if (host.includes('tiktok.com')) url.pathname = `/${parts.find((part) => part.startsWith('@')) || parts[0] || ''}`;
    if (host.includes('youtube.com')) {
      const at = parts.find((part) => part.startsWith('@'));
      url.pathname = at ? `/${at}` : `/${parts.slice(0, 2).join('/')}`;
    }
    return url.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/[?#].*$/, '').replace(/\/$/, '');
  }
}

function keysFromUrl(value) {
  const raw = readLink(value);
  const keys = [];
  if (!/^https?:\/\//i.test(raw)) return keys;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    if (host.includes('tiktok.com')) keys.push(norm(parts.find((part) => part.startsWith('@')) || parts[0]));
    if (host.includes('instagram.com')) {
      const blocked = new Set(['p', 'reel', 'reels', 'tv', 'stories']);
      keys.push(norm(parts.find((part) => !blocked.has(part.toLowerCase())) || ''));
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      keys.push(norm(parts.find((part) => part.startsWith('@')) || ''));
      for (let i = 1; i < parts.length; i += 1) {
        if (['channel', 'c', 'user'].includes((parts[i - 1] || '').toLowerCase())) keys.push(norm(parts[i]));
      }
    }
  } catch {}
  return [...new Set(keys.filter(Boolean))];
}

function emailKeys(value) {
  return [...text(value).toLowerCase().matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g)].map((m) => m[0]);
}

function platformFromUrl(value) {
  const raw = readLink(value).toLowerCase();
  if (raw.includes('instagram.com')) return 'instagramreels';
  if (raw.includes('tiktok.com')) return 'tiktok';
  if (raw.includes('youtube.com') || raw.includes('youtu.be')) return raw.includes('/shorts') ? 'youtubeshort' : 'youtubevideo';
  return '';
}

function platformLabel(value) {
  const raw = text(value).toLowerCase().replace(/\s+/g, '');
  if (raw.includes('instagram') || raw.includes('reels')) return 'instagramreels';
  if (raw.includes('tiktok') || raw.includes('tk')) return 'tiktok';
  if (raw.includes('short')) return 'youtubeshort';
  if (raw.includes('youtube') || raw.includes('dedicated')) return 'youtubevideo';
  return raw;
}

function platformDisplay(value) {
  return {
    instagramreels: 'Instagram Reels',
    tiktok: 'TikTok',
    youtubeshort: 'YouTube Shorts',
    youtubevideo: 'YouTube Video'
  }[platformLabel(value)] || text(value) || '-';
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = text(value).replace(/,/g, '').toLowerCase();
  if (!raw) return 0;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  let number = Number(match[1]);
  if (/m|百万/.test(raw)) number *= 1000000;
  else if (/k|千/.test(raw)) number *= 1000;
  else if (/万/.test(raw)) number *= 10000;
  return Math.round(number);
}

const CN_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

function numberToken(value) {
  const raw = text(value);
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === '十') return 10;
  if (/^十[一二两三四五六七八九]$/.test(raw)) return 10 + CN_NUM[raw[1]];
  if (/^[一二两三四五六七八九]十$/.test(raw)) return CN_NUM[raw[0]] * 10;
  if (/^[一二两三四五六七八九]十[一二两三四五六七八九]$/.test(raw)) return CN_NUM[raw[0]] * 10 + CN_NUM[raw[2]];
  return CN_NUM[raw] || 0;
}

function extractMonths(reason) {
  const raw = text(reason);
  const matches = [...raw.matchAll(/(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*个?月/g)];
  if (!matches.length) return 1;
  return Math.max(...matches.map((m) => numberToken(m[1]) || 1));
}

function addDeliverable(bucket, platform, count) {
  const key = platformLabel(platform);
  if (!key || !count) return;
  bucket[key] = (bucket[key] || 0) + Number(count);
}

function parseStructuredDeliverables(row) {
  const output = {};
  const fields = [
    ['YouTube dedicated数量', 'youtubevideo'],
    ['YouTube Shorts数量', 'youtubeshort'],
    ['Instagram Reels数量', 'instagramreels'],
    ['TikTok视频数量', 'tiktok']
  ];
  for (const [field, platform] of fields) {
    const count = parseNumber(row[field]);
    if (count) addDeliverable(output, platform, count);
  }
  return output;
}

function parseContractDeliverables(reason) {
  const raw = text(reason);
  const lower = raw.toLowerCase();
  const months = extractMonths(raw);
  const video = {};
  let live = 0;
  const notes = [];

  const addPattern = (regex, platform, multiplyByMonths = false) => {
    for (const match of lower.matchAll(regex)) {
      const count = numberToken(match[1]) || Number(match[1]) || 0;
      addDeliverable(video, platform, multiplyByMonths ? count * months : count);
    }
  };

  addPattern(/(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*\*?\s*(?:instagram\s*)?reels?/g, 'instagramreels');
  addPattern(/(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*\*?\s*(?:youtube\s*)?shorts?/g, 'youtubeshort');
  addPattern(/(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*\*?\s*(?:dedicated|youtube\s*dedicated|youtube\s*video)/g, 'youtubevideo');
  addPattern(/(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*\*?\s*(?:tk|tiktok)/g, 'tiktok');
  addPattern(/每(?:个)?月[^。\n\r；;]{0,20}?(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*(?:个|条)?(?:短)?视频/g, 'tiktok', true);

  for (const match of lower.matchAll(/(?:共|至少)?\s*(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*(?:个|条|支)?(?:tk|tiktok)?短视频/g)) {
    const count = numberToken(match[1]) || Number(match[1]) || 0;
    addDeliverable(video, lower.slice(Math.max(0, match.index - 20), match.index + 40).includes('tk') ? 'tiktok' : 'tiktok', count);
  }
  for (const match of lower.matchAll(/(?:共|至少)?\s*(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*(?:个|条|支)?(?:instagram)?短视频/g)) {
    const count = numberToken(match[1]) || Number(match[1]) || 0;
    if (!Object.values(video).reduce((a, b) => a + b, 0)) addDeliverable(video, 'instagramreels', count);
  }
  for (const match of lower.matchAll(/每(?:个)?月[^。\n\r；;]{0,20}?(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*(?:场)?直播/g)) {
    const count = numberToken(match[1]) || Number(match[1]) || 0;
    live += count * months;
  }
  for (const match of lower.matchAll(/(?:至少)?\s*(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*场直播/g)) {
    const count = numberToken(match[1]) || Number(match[1]) || 0;
    live = Math.max(live, count);
  }
  if (/同步到全平台|同步全平台|全平台同步|cross-post|co-post/i.test(raw)) notes.push('含同步/全平台发布');
  const videoTotal = Object.values(video).reduce((sum, value) => sum + value, 0);
  return {
    months,
    video,
    live,
    status: videoTotal || live ? '已解析' : '待人工确认',
    notes
  };
}

function primaryProfileLinks(row) {
  const links = [];
  for (const field of ['主平台链接（Instagram）', 'YouTube video链接', 'TikTok 主页链接', 'YouTube short 链接']) {
    const raw = text(row[field]);
    if (!raw) continue;
    links.push(...splitLinks(raw));
    if (/^https?:\/\//i.test(raw)) links.push(raw);
  }
  return [...new Set(links.map(normalizeProfileUrl).filter(Boolean))];
}

function matchKeysForMarketing(row) {
  const keys = new Set([norm(row['红人编码']), norm(row['名字'])]);
  primaryProfileLinks(row).flatMap(keysFromUrl).forEach((key) => keys.add(key));
  emailKeys(row['联系方式']).forEach((email) => keys.add(email));
  return [...keys].filter(Boolean);
}

function buildLocalIndex(influencers) {
  const byKey = new Map();
  const byLink = new Map();
  influencers.forEach((row, index) => {
    const fields = row.fields || row;
    const keys = [norm(fields['红人编码']), norm(fields['红人名称']), ...keysFromUrl(fields['红人链接'])].filter(Boolean);
    for (const key of keys) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ row, index });
    }
    const profile = normalizeProfileUrl(fields['红人链接']);
    if (profile) byLink.set(profile, { row, index });
  });
  return { byKey, byLink };
}

function findMatches(index, keys, links) {
  const found = new Map();
  for (const link of links) {
    const match = index.byLink.get(normalizeProfileUrl(link));
    if (match) found.set(match.index, match);
  }
  for (const key of keys) {
    for (const match of index.byKey.get(key) || []) found.set(match.index, match);
  }
  return [...found.values()];
}

function videoViews(fields) {
  return Math.max(parseNumber(fields.mature7dViews), parseNumber(fields['7日成熟声量']), parseNumber(fields.videoPlayCount), parseNumber(fields.videoViewCount));
}

function videoDate(fields) {
  const parsed = new Date(text(fields.timestamp));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function videoKey(fields) {
  return norm(fields['红人名称']);
}

function summarizeCompletedVideos(videos, creatorName, platform) {
  const key = norm(creatorName);
  const platformKey = platformLabel(platform);
  return videos
    .map((row) => row.fields || row)
    .filter((fields) => videoKey(fields) === key)
    .filter((fields) => !platformKey || platformLabel(fields['平台']) === platformKey)
    .length;
}

function videoPostKey(fields) {
  const platform = platformLabel(fields['平台']);
  const id = text(fields.id || fields.postId);
  if (platform && id) return `${platform}_${id}`;
  const url = readLink(fields.url || fields.videoUrl);
  return platform && url ? `${platform}_${url}` : '';
}

function milestoneViewsByPostKey(snapshots, typeMatcher) {
  const map = new Map();
  for (const row of snapshots) {
    const fields = row.fields || row;
    const key = text(fields.postKey) || videoPostKey(fields);
    if (!key || !typeMatcher(text(fields.snapshotType))) continue;
    const views = Math.max(parseNumber(fields.videoPlayCount), parseNumber(fields.videoViewCount));
    if (views > (map.get(key) || 0)) map.set(key, views);
  }
  return map;
}

async function loadMarketingRows() {
  const sheets = await worksheetRows(marketingPath);
  const sheet = sheets.find((item) => item.sheetName.includes('合作')) || sheets[0];
  const headerIndex = findHeaderRow(sheet.rows, ['红人编码', '合作日期']);
  const headers = sheet.rows[headerIndex].map(compact);
  return sheet.rows
    .slice(headerIndex + 1)
    .map((row, index) => ({ ...rowObject(headers, row), __sheetName: sheet.sheetName, __rowNumber: headerIndex + index + 2 }))
    .filter((row) => text(row['名字']) || text(row['红人编码']));
}

async function loadContractRows() {
  const sheets = await worksheetRows(contractPath);
  const rows = [];
  for (const sheet of sheets) {
    if (!sheet.rows.length) continue;
    const headerIndex = findHeaderRow(sheet.rows, ['红人名字', '签署事由']);
    const headers = sheet.rows[headerIndex].map(compact);
    sheet.rows.slice(headerIndex + 1).forEach((row, index) => {
      const item = rowObject(headers, row);
      if (!text(item['红人名字']) && !text(item['签署事由'])) return;
      rows.push({ ...item, __sheetName: sheet.sheetName, __rowNumber: headerIndex + index + 2 });
    });
  }
  return rows;
}

function contractKeys(row) {
  const reason = text(row['签署事由']);
  const keys = new Set([norm(row['红人名字'])]);
  splitLinks(reason).flatMap(keysFromUrl).forEach((key) => keys.add(key));
  emailKeys(reason).forEach((email) => keys.add(email));
  return [...keys].filter(Boolean);
}

function isLiveOrSalesText(value) {
  return /直播|带货|付费直播|tiktok shop|tiktokshop/i.test(text(value));
}

function isLiveOrSalesContract(row) {
  return isLiveOrSalesText(row.__sheetName) || isLiveOrSalesText(row['红人类型']) || isLiveOrSalesText(row['签署事由']);
}

function isLiveOrSalesInfluencer(row) {
  const fields = row.fields || row;
  return [
    fields['红人编码'],
    fields['合作服务'],
    fields['合同类型'],
    fields['合同交付摘要'],
    fields['合同交付平台拆分'],
    fields['追踪原因']
  ].some(isLiveOrSalesText);
}

function isLiveOrSalesMarketingRow(row) {
  return [
    row['红人编码'],
    row['类型'],
    row['合作模式'],
    row['备注'],
    row['其他交付物']
  ].some(isLiveOrSalesText);
}

function mergeDeliverables(...parts) {
  const output = {};
  for (const part of parts) {
    for (const [platform, count] of Object.entries(part || {})) addDeliverable(output, platform, count);
  }
  return output;
}

function deliverableText(video, live = 0) {
  const pieces = Object.entries(video || {})
    .filter(([, count]) => count > 0)
    .map(([platform, count]) => `${platformDisplay(platform)} ${count}条`);
  return pieces.join(' / ') || '待人工确认';
}

function safeBrief(value, length = 240) {
  return compact(value).slice(0, length);
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  let [influencers, videos, snapshots, marketingRows, contractRows] = await Promise.all([
    readJson('influencers'),
    readJson('videos'),
    readJson('snapshots'),
    loadMarketingRows(),
    loadContractRows()
  ]);
  const removedLiveInfluencers = [];
  influencers = influencers.filter((row) => {
    if (!isLiveOrSalesInfluencer(row)) return true;
    removedLiveInfluencers.push({
      id: row.id || '',
      source: row.source || '',
      name: compact((row.fields || row)['红人名称']),
      code: compact((row.fields || row)['红人编码']),
      reason: '直播/带货不属于当前红人视频监控范围'
    });
    return false;
  });
  contractRows = contractRows.filter((row) => !isLiveOrSalesContract(row));
  const index = buildLocalIndex(influencers);
  const contractByKey = new Map();
  const contractParsedRows = [];
  for (const contract of contractRows) {
    const parsed = parseContractDeliverables(contract['签署事由']);
    const keys = contractKeys(contract);
    const item = { contract, parsed, keys };
    contractParsedRows.push(item);
    for (const key of keys) {
      if (!contractByKey.has(key)) contractByKey.set(key, []);
      contractByKey.get(key).push(item);
    }
  }

  const added = [];
  const updated = [];
  const conflicts = [];
  const deliverableRows = [];
  const newCooperationRows = [];
  const reportCoopRows = [];

  for (const marketing of marketingRows) {
    if (isLiveOrSalesMarketingRow(marketing)) continue;
    const name = compact(marketing['名字']);
    const code = compact(marketing['红人编码']);
    const links = primaryProfileLinks(marketing);
    const keys = matchKeysForMarketing(marketing);
    const matches = findMatches(index, keys, links);
    const relatedContracts = [...new Set(keys.flatMap((key) => contractByKey.get(key) || []))];
    const structuredVideo = parseStructuredDeliverables(marketing);
    const contractVideo = relatedContracts.reduce((acc, item) => mergeDeliverables(acc, item.parsed.video), {});
    const videoDeliverables = Object.values(structuredVideo).reduce((sum, value) => sum + value, 0) ? structuredVideo : contractVideo;
    const liveDeliverables = 0;
    const hasStructuredVideo = Object.values(structuredVideo).some(Boolean);
    const hasParsedContract = relatedContracts.some((item) => item.parsed.status === '已解析');
    const parseStatus = hasParsedContract || hasStructuredVideo ? '已解析' : relatedContracts.length ? '待人工确认' : '';
    const expectedVideo = Object.values(videoDeliverables).reduce((sum, value) => sum + value, 0);
    const completedVideo = Object.entries(videoDeliverables).reduce((sum, [platform]) => sum + summarizeCompletedVideos(videos, name, platform), 0) || summarizeCompletedVideos(videos, name, '');
    const remainingVideo = Math.max(0, expectedVideo - completedVideo);
    const signedAt = relatedContracts.map((item) => dateValue(item.contract['盖章日期'])).filter(Boolean).sort().at(-1) || '';
    const contractType = relatedContracts.map((item) => compact(item.contract['合同类型'])).filter(Boolean).join(' / ');
    const serviceType = relatedContracts.map((item) => compact(item.contract['红人类型'])).filter(Boolean).join(' / ') || compact(marketing['合作模式']);
    const amount = relatedContracts.map((item) => compact(item.contract['合同涉及总额'])).filter(Boolean).join(' / ');
    const baseFields = {
      合作日期: dateValue(marketing['合作日期']),
      合作进度: compact(marketing['合作进度']),
      合作模式: compact(marketing['合作模式']),
      合作车型: compact(marketing['合作车型']),
      合作周期: compact(marketing['合作周期']),
      合作量级: compact(marketing['量级']),
      合作服务: serviceType || compact(marketing['合作模式']) || '待补充',
      合同签署日期: signedAt,
      合同类型: contractType,
      合同金额: amount,
      预计视频交付: expectedVideo || '',
      已上线视频: completedVideo || 0,
      待补视频交付: expectedVideo ? remainingVideo : '',
      视频交付完成率: expectedVideo ? `${Math.min(100, Math.round((completedVideo / expectedVideo) * 100))}%` : '',
      合同交付平台拆分: expectedVideo || liveDeliverables ? deliverableText(videoDeliverables, liveDeliverables) : relatedContracts.length ? '待人工确认' : '',
      合同交付解析状态: parseStatus,
      合同交付摘要: safeBrief(relatedContracts.map((item) => item.contract['签署事由']).filter(Boolean).join(' || ')),
      红人粉丝数据: parseNumber(marketing['粉丝']) || undefined,
      粉丝数据来源: parseNumber(marketing['粉丝']) ? '营销总表' : undefined,
      粉丝数据更新时间: parseNumber(marketing['粉丝']) ? new Date().toISOString().slice(0, 10) : undefined
    };

    const nonEmptyBaseFields = Object.fromEntries(Object.entries(baseFields).filter(([, value]) => value !== undefined && value !== ''));
    if (matches.length) {
      for (const match of matches) {
        const fields = match.row.fields || match.row;
        for (const fieldName of COOP_WRITE_FIELDS) fields[fieldName] = baseFields[fieldName] === undefined ? '' : baseFields[fieldName];
        if (baseFields['红人粉丝数据']) {
          fields['红人粉丝数据'] = baseFields['红人粉丝数据'];
          fields['粉丝数据来源'] = baseFields['粉丝数据来源'];
          fields['粉丝数据更新时间'] = baseFields['粉丝数据更新时间'];
        }
        if (code && !text(fields['红人编码'])) fields['红人编码'] = code;
        if (!text(fields['地区']) && code.includes('-')) fields['地区'] = code.split('-')[0];
        if (!text(fields['负责人']) && text(marketing['负责人'])) fields['负责人'] = compact(marketing['负责人']);
        updated.push({ row: marketing.__rowNumber, name, code, matchedRecord: match.row.id || match.index });
      }
    } else {
      const candidateLinks = links.length ? links : [''];
      for (const link of candidateLinks) {
        const platform = platformFromUrl(link) || platformLabel(compact(marketing['平台'])) || '';
        const record = {
          id: stableId('coop', `${code}|${name}|${link || marketing.__rowNumber}`),
          fields: {
            是否监控: '是',
            红人链接: link ? linkCell(link) : '',
            平台: platform,
            是否出视频: /已出|已上线|已发/.test(compact(marketing['合作进度'])) ? '是' : '否',
            红人名称: name,
            红人编码: code,
            地区: code.includes('-') ? code.split('-')[0] : '',
            负责人: compact(marketing['负责人']),
            缺主页链接: link ? '' : '是',
            ...nonEmptyBaseFields
          },
          source: 'cooperation-import',
          importedAt: new Date().toISOString()
        };
        influencers.push(record);
        added.push({ row: marketing.__rowNumber, name, code, platform, link, reason: link ? '新增合作达人' : '缺主页链接，按红人编码占位' });
      }
    }

    if (matches.length > 1 && expectedVideo) {
      conflicts.push({ row: marketing.__rowNumber, name, code, issue: '同一合作记录匹配多条本地平台记录，已同步相同交付摘要', matched: matches.length });
    }

    const coopDate = new Date(`${dateValue(marketing['合作日期'])}T00:00:00+08:00`);
    if (coopDate >= REPORT_START && coopDate < REPORT_END) {
      reportCoopRows.push({
        合作日期: dateValue(marketing['合作日期']),
        负责人: compact(marketing['负责人']),
        红人编码: code,
        红人名称: name,
        地区: code.includes('-') ? code.split('-')[0] : '',
        量级: compact(marketing['量级']),
        合作进度: compact(marketing['合作进度']),
        合作模式: compact(marketing['合作模式']),
        合作车型: compact(marketing['合作车型']),
        预计交付: expectedVideo || liveDeliverables ? deliverableText(videoDeliverables, liveDeliverables) : relatedContracts.length ? '待人工确认' : '',
        已上线视频: completedVideo,
        待补视频: expectedVideo ? remainingVideo : '',
        合同类型: contractType,
        合同签署日期: signedAt,
        解析状态: parseStatus
      });
    }

    deliverableRows.push({
      红人名称: name,
      红人编码: code,
      负责人: compact(marketing['负责人']),
      地区: code.includes('-') ? code.split('-')[0] : '',
      合作日期: dateValue(marketing['合作日期']),
      合作进度: compact(marketing['合作进度']),
      合作服务: serviceType || compact(marketing['合作模式']),
      合同类型: contractType,
      合同金额: amount,
      预计视频交付: expectedVideo,
      已上线视频: completedVideo,
      待补视频交付: expectedVideo ? remainingVideo : '',
      平台拆分: expectedVideo || liveDeliverables ? deliverableText(videoDeliverables, liveDeliverables) : relatedContracts.length ? '待人工确认' : '',
      解析状态: parseStatus,
      备注: relatedContracts.length && !expectedVideo && !liveDeliverables ? '合同未明确交付数量，需要人工确认' : ''
    });
  }

  const localIndexAfter = buildLocalIndex(influencers);
  const sevenDayViews = milestoneViewsByPostKey(snapshots, (type) => /7|七/.test(type));
  const thirtyDayViews = milestoneViewsByPostKey(snapshots, (type) => /30|三十/.test(type));
  for (const row of videos) {
    const fields = row.fields || row;
    fields['是否计入合同交付'] = '';
    fields['对应合同平台'] = '';
    fields['合同交付类型'] = '';
    const creator = compact(fields['红人名称']);
    const matches = findMatches(localIndexAfter, [norm(creator)], []);
    const influencer = matches[0]?.row?.fields || matches[0]?.row || {};
    const expectedText = compact(influencer['合同交付平台拆分']);
    if (expectedText) {
      fields['是否计入合同交付'] = '是';
      fields['对应合同平台'] = platformDisplay(fields['平台']);
      fields['合同交付类型'] = expectedText;
    }
    const postKey = videoPostKey(fields);
    const v7 = sevenDayViews.get(postKey);
    const v30 = thirtyDayViews.get(postKey);
    if (v7) fields['7日成熟声量'] = v7;
    if (v30) fields['30日成熟声量'] = v30;
  }

  const reportVideoRows = videos
    .map((row) => row.fields || row)
    .filter((fields) => {
      const date = videoDate(fields);
      return date && date >= REPORT_START && date < REPORT_END;
    })
    .map((fields) => ({
      上线时间: videoDate(fields)?.toISOString().slice(0, 10) || '',
      红人名称: compact(fields['红人名称']),
      负责人: compact(fields['负责人']),
      地区: compact(fields['地区']),
      平台: platformDisplay(fields['平台']),
      视频链接: readLink(fields.url || fields.videoUrl),
      七日声量: parseNumber(fields['7日成熟声量']) || videoViews(fields),
      三十日声量: parseNumber(fields['30日成熟声量']) || '',
      是否计入合同交付: compact(fields['是否计入合同交付']),
      合同交付类型: compact(fields['合同交付类型'])
    }));

  const pendingRows = deliverableRows.filter((row) => row.解析状态 === '待人工确认' || Number(row.待补视频交付) > 0);
  const byRegion = new Map();
  for (const row of reportCoopRows) {
    const key = row.地区 || '未标注';
    byRegion.set(key, (byRegion.get(key) || 0) + 1);
  }
  const regionRows = [...byRegion.entries()].map(([地区, 合作人数]) => ({ 地区, 合作人数 }));

  const backupTag = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.writeFile(path.join(LOCAL_DIR, `influencers.backup-before-cooperation-${backupTag}.json`), JSON.stringify(await readJson('influencers'), null, 2), 'utf8');
  await fs.writeFile(path.join(LOCAL_DIR, `videos.backup-before-cooperation-${backupTag}.json`), JSON.stringify(await readJson('videos'), null, 2), 'utf8');
  await writeJson('influencers', influencers);
  await writeJson('videos', videos);

  const reportPrefix = path.join(REPORT_DIR, 'cooperation-deliverables-2026-06-06_2026-06-12');
  await writeCsv(`${reportPrefix}-新增合作达人明细.csv`, reportCoopRows, Object.keys(reportCoopRows[0] || { 合作日期: '', 负责人: '', 红人编码: '', 红人名称: '', 地区: '' }));
  await writeCsv(`${reportPrefix}-区域分布.csv`, regionRows, ['地区', '合作人数']);
  await writeCsv(`${reportPrefix}-合同交付明细.csv`, deliverableRows, Object.keys(deliverableRows[0] || { 红人名称: '', 预计视频交付: '' }));
  await writeCsv(`${reportPrefix}-上线视频明细.csv`, reportVideoRows, Object.keys(reportVideoRows[0] || { 上线时间: '', 红人名称: '', 平台: '' }));
  await writeCsv(`${reportPrefix}-待人工确认和缺口.csv`, pendingRows, Object.keys(pendingRows[0] || { 红人名称: '', 备注: '' }));
  await writeCsv(path.join(REPORT_DIR, 'cooperation-import-added-preview.csv'), added, ['row', 'name', 'code', 'platform', 'link', 'reason']);
  await writeCsv(path.join(REPORT_DIR, 'cooperation-import-conflicts.csv'), conflicts, ['row', 'name', 'code', 'issue', 'matched']);

  const summary = {
    generatedAt: new Date().toISOString(),
    marketingRows: marketingRows.length,
    contractRows: contractRows.length,
    updatedInfluencerRows: updated.length,
    addedInfluencerRows: added.length,
    deliverableRows: deliverableRows.length,
    pendingRows: pendingRows.length,
    removedLiveInfluencers: removedLiveInfluencers.length,
    reportPeriod: { start: REPORT_START.toISOString(), end: REPORT_END.toISOString() },
    reportCooperations: reportCoopRows.length,
    reportVideos: reportVideoRows.length,
    regionRows,
    files: {
      addedPreview: path.join(REPORT_DIR, 'cooperation-import-added-preview.csv'),
      conflicts: path.join(REPORT_DIR, 'cooperation-import-conflicts.csv'),
      reportPrefix
    }
  };
  await fs.writeFile(path.join(REPORT_DIR, 'cooperation-deliverables-summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
