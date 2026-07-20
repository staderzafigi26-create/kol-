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
  runs: 'runs.json',
  affiliateSales: 'affiliate_sales.json'
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
    '合作日期',
    '合作进度',
    '合作模式',
    '合作车型',
    '合作周期',
    '合作量级',
    '合作服务',
    '合同签署日期',
    '合同类型',
    '预计视频交付',
    '已上线视频',
    '待补视频交付',
    '视频交付完成率',
    '合同交付平台拆分',
    '合同交付解析状态',
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
    '负责人',
    '负责人名称',
    '地区',
    '国家/地区',
    '红人编码',
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
    'displayUrl',
    '是否计入合同交付',
    '对应合同平台',
    '合同交付类型',
    '7日成熟声量',
    '30日成熟声量',
    'mature7dViews',
    'mature30dViews'
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
  affiliateSales: [
    'affiliateName',
    'referralCode',
    'couponCode',
    'referralLink',
    'market',
    'state',
    'country',
    'instagram',
    'youtube',
    'tiktok',
    'website',
    'status',
    'lastActive',
    'dateCreated',
    'dateApproved',
    'hasOrderMetrics',
    'orders',
    'revenue',
    'commission',
    'matchStatus',
    'matchCount',
    'creatorName',
    'creatorCode',
    'owner',
    'region',
    'tier',
    'followers',
    'platformType',
    'marketingAffiliateCode',
    'cooperationDate',
    'cooperationProgress',
    'firstPostUrl',
    'firstPostDate',
    'settled',
    'subtotal',
    'revenueByCurrency',
    'commissionByCurrency',
    'statusBreakdown',
    'firstOrderDate',
    'lastOrderDate',
    'latestDiscountCodes',
    'conversionSources',
    'affiliateSources',
    'metricsNotice',
    'importedAt'
  ]
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
  await fs.writeFile(
    path.join(STATIC_DIR, 'collections.json'),
    JSON.stringify(
      {
        ok: true,
        generatedAt: new Date().toISOString(),
        privacy: 'Sanitized read-only team snapshot. Contact fields, payment fields and order identifiers are excluded; affiliate sales are published as creator-level aggregates.',
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
