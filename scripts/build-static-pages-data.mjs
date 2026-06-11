import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_DIR = path.join(ROOT, 'data', 'local');
const PUBLIC_DIR = path.join(ROOT, 'public');
const STATIC_DIR = path.join(PUBLIC_DIR, 'static-data');
const EXPORT_DIR = path.join(STATIC_DIR, 'exports');
const API_BASE = process.env.STATIC_API_BASE || 'http://127.0.0.1:3000';
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const COLLECTION_FILES = {
  influencers: 'influencers.json',
  videos: 'videos.json',
  snapshots: 'snapshots.json',
  runs: 'runs.json'
};

const FIELD_ALLOWLIST = {
  influencers: [
    '是否监控',
    '红人链接',
    '平台',
    '是否出视频',
    '红人名称',
    '样品型号',
    '红人编码',
    '地区',
    '负责人',
    '红人粉丝数据',
    '粉丝数据来源',
    '粉丝数据更新时间',
    '追踪优先级',
    '追踪评分',
    '追踪原因',
    '追踪批次更新时间',
    'url',
    'url2',
    'url3'
  ],
  videos: [
    '是否监控',
    'likesCount',
    'videoUrl',
    '平台',
    'commentsCount',
    '红人名称',
    'id',
    'videoPlayCount',
    'videoViewCount',
    'url',
    'timestamp',
    'displayUrl'
  ],
  snapshots: [
    'postUrl',
    'snapshotType',
    'sharesCount',
    'viewDelta',
    'isFirstSeen',
    'postId',
    'videoPlayCount',
    'firstSeenAt',
    'platform',
    'isProductPost',
    '是否监控',
    'playDelta',
    'commentDelta',
    'postKey',
    'likesCount',
    'shareDelta',
    'commentsCount',
    'capturedAt',
    '红人名称',
    'runId',
    'likeDelta',
    'videoViewCount'
  ],
  runs: [
    'createdAt',
    'finishedAt',
    'task',
    'status',
    'message',
    'days',
    'maxItems',
    'limitInfluencers',
    'skipInfluencers',
    'platformFilter',
    'usageUsd',
    'scraped',
    'matched',
    'videoCreated',
    'videoSkipped',
    'snapshotCreated'
  ],
  affiliateSales: []
};

function pickFields(fields = {}, allowlist = []) {
  const output = {};
  for (const key of allowlist) {
    if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') output[key] = redactSensitiveValue(fields[key]);
  }
  return output;
}

function redactSensitiveValue(value) {
  if (typeof value === 'string') return value.replace(EMAIL_RE, '[hidden]');
  if (Array.isArray(value)) return value.map(redactSensitiveValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactSensitiveValue(item)]));
  }
  return value;
}

async function readJsonArray(filename) {
  try {
    const value = JSON.parse(await fs.readFile(path.join(LOCAL_DIR, filename), 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (_error) {
    return [];
  }
}

function sanitizeRows(collection, rows) {
  const allowlist = FIELD_ALLOWLIST[collection] || [];
  return rows.map((row, index) => {
    const fields = pickFields(row.fields || row, allowlist);
    return {
      id: row.id || row.recordId || `${collection}_${index + 1}`,
      fields,
      source: row.source || 'static',
      importedAt: row.importedAt || '',
      updatedAt: row.updatedAt || ''
    };
  });
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows) {
  const fieldRows = rows.map((row) => row.fields || row);
  const keys = [...new Set(fieldRows.flatMap((row) => Object.keys(row)))];
  return [keys.map(csvEscape).join(','), ...fieldRows.map((row) => keys.map((key) => csvEscape(row[key])).join(','))].join('\n');
}

async function fetchDashboard() {
  const response = await fetch(`${API_BASE}/api/local/dashboard?weeks=8`);
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || `Dashboard request failed: HTTP ${response.status}`);
  return data;
}

async function main() {
  await fs.rm(STATIC_DIR, { recursive: true, force: true });
  await fs.mkdir(EXPORT_DIR, { recursive: true });

  const collections = {};
  const counts = {};
  for (const [collection, filename] of Object.entries(COLLECTION_FILES)) {
    const rows = sanitizeRows(collection, await readJsonArray(filename));
    collections[collection] = rows;
    counts[collection] = rows.length;
    await fs.writeFile(path.join(EXPORT_DIR, `${collection}.json`), JSON.stringify(rows, null, 2), 'utf8');
    await fs.writeFile(path.join(EXPORT_DIR, `${collection}.csv`), rowsToCsv(rows), 'utf8');
  }
  collections.affiliateSales = [];
  counts.affiliateSales = 0;

  await fs.writeFile(
    path.join(STATIC_DIR, 'collections.json'),
    JSON.stringify(
      {
        ok: true,
        generatedAt: new Date().toISOString(),
        privacy: 'Sanitized read-only team snapshot. Contact fields, payment fields, order identifiers and affiliate order rows are excluded.',
        counts,
        collections
      },
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(path.join(STATIC_DIR, 'dashboard.json'), JSON.stringify(await fetchDashboard(), null, 2), 'utf8');
  console.log(`Static team snapshot generated in ${path.relative(ROOT, STATIC_DIR)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
