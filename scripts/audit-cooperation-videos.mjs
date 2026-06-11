import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbookPath = process.argv[2] || '/Users/ryan/Downloads/Yozma-红人营销总表 (3).xlsx';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, ' ')
    .replace(/[，,。./\\|:：;；()[\]{}'"“”‘’]+/g, '')
    .trim();
}

function readCellText(value) {
  if (value == null) return '';
  if (typeof value === 'object') return normalizeText(value.text || value.name || value.value || value.link || '');
  return normalizeText(value);
}

async function loadJson(name) {
  const text = await fs.readFile(path.join(projectRoot, 'data', 'local', `${name}.json`), 'utf8');
  return JSON.parse(text);
}

function findHeaderRow(rows) {
  let best = { index: -1, score: 0 };
  rows.slice(0, 20).forEach((row, index) => {
    const cells = row.map(readCellText);
    const joined = cells.join('|').toLowerCase();
    let score = 0;
    if (/红人|达人|kol|influencer|博主|账号|姓名|name/.test(joined)) score += 3;
    if (/平台|platform|tiktok|youtube|instagram|ins/.test(joined)) score += 2;
    if (/链接|主页|url|link|账号/.test(joined)) score += 2;
    if (/合作|寄样|状态|时间|年份|date|status/.test(joined)) score += 1;
    if (score > best.score) best = { index, score };
  });
  return best.score >= 3 ? best.index : 0;
}

function headerKey(header) {
  const text = normalizeText(header).toLowerCase();
  if (/编码|code|联盟/.test(text)) return '';
  if (/链接|主页|profile|url|link|账号链接/.test(text)) return 'link';
  if (/^名字$|姓名|昵称|红人名称|达人名称|kol名称|influencer name|creator name|账号名称|账号名|name/.test(text)) return 'name';
  if (/平台|platform/.test(text)) return 'platform';
  if (/状态|进度|合作阶段|合作情况|是否合作|status/.test(text)) return 'status';
  if (/时间|日期|年份|合作时间|寄样时间|date|year/.test(text)) return 'date';
  if (/视频|上线|发布|post|deliverable/.test(text)) return 'videoStatus';
  if (/出单|订单|销售|sales|order/.test(text)) return 'sales';
  if (/粉丝|followers|fans/.test(text)) return 'followers';
  return '';
}

function extractMatchKeysFromUrl(value) {
  const raw = normalizeText(value);
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

function inferPlatformFromUrl(value) {
  const raw = normalizeText(value).toLowerCase();
  if (raw.includes('tiktok.com')) return 'TikTok';
  if (raw.includes('instagram.com')) return 'Instagram';
  if (raw.includes('youtube.com') || raw.includes('youtu.be')) return raw.includes('/shorts/') ? 'YouTube Shorts' : 'YouTube';
  return '';
}

function rowToRecord(headers, values, sheetName, rowNumber) {
  const record = { sheetName, rowNumber, raw: {}, links: [], matchKeys: new Set() };
  headers.forEach((header, index) => {
    const label = readCellText(header);
    const value = readCellText(values[index]);
    if (!label || !value) return;
    record.raw[label] = value;
    const key = headerKey(label);
    if (key === 'link') {
      record.links.push(value);
      if (!record.link) record.link = value;
    } else if (key && !record[key]) {
      record[key] = value;
    }
  });
  record.name = normalizeText(record.name);
  const linkMatchKeys = [];
  for (const link of record.links) {
    for (const key of extractMatchKeysFromUrl(link)) linkMatchKeys.push(key);
  }
  if (!record.name && linkMatchKeys.length) record.name = linkMatchKeys[0];
  record.normalizedName = normalizeName(record.name);
  if (record.normalizedName) record.matchKeys.add(record.normalizedName);
  for (const key of linkMatchKeys) record.matchKeys.add(key);
  const inferredPlatforms = [...new Set(record.links.map(inferPlatformFromUrl).filter(Boolean))];
  if (!record.platform && inferredPlatforms.length) record.platform = inferredPlatforms.join(' / ');
  record.matchKeys = [...record.matchKeys].filter(Boolean);
  record.platform = normalizeText(record.platform);
  record.link = normalizeText(record.link);
  record.status = normalizeText(record.status);
  record.date = normalizeText(record.date);
  record.videoStatus = normalizeText(record.videoStatus);
  record.sales = normalizeText(record.sales);
  return record;
}

function parseYear(record) {
  const text = [record.date, record.status, record.videoStatus, record.sales, ...Object.values(record.raw || {})].join(' ');
  const match = text.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function hasPublishedSignal(record) {
  const text = [record.videoStatus, record.status, ...Object.values(record.raw || {})].join(' ');
  return /已发|已发布|已上线|posted|published|上线/.test(text) && !/未发|未发布|待发布|未上线/.test(text);
}

function hasSalesSignal(record) {
  const text = [record.sales, record.status, ...Object.values(record.raw || {})].join(' ');
  if (/无出单|未出单|没有出单|0单|0 单|no order|no sales/i.test(text)) return false;
  return /出单|订单|销售|持续|复购|order|sales/i.test(text);
}

function getField(row, names) {
  const fields = row.fields || row;
  for (const name of names) {
    const value = fields[name];
    if (value == null) continue;
    const text = readCellText(value);
    if (text) return text;
  }
  return '';
}

function videoViews(fields) {
  return Math.max(Number(fields.videoPlayCount) || 0, Number(fields.videoViewCount) || 0, Number(fields.views) || 0);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
  const sheets = [];
  for (const sheetName of sheetNames) {
    const sheet = workbook.worksheets.getItem(sheetName);
    const used = sheet.getUsedRange(true);
    const values = used?.values || [];
    sheets.push({ sheetName, rows: values });
  }
  return sheets;
}

async function main() {
  const input = await FileBlob.load(workbookPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const sheets = await getWorksheetRows(workbook);

  const cooperationRecords = [];
  const sheetSummaries = [];
  for (const sheet of sheets) {
    const rows = sheet.rows || [];
    if (!rows.length) continue;
    const headerRow = findHeaderRow(rows);
    const headers = rows[headerRow] || [];
    const records = rows
      .slice(headerRow + 1)
      .map((row, index) => rowToRecord(headers, row, sheet.sheetName, headerRow + index + 2))
      .filter((record) => record.normalizedName && record.normalizedName.length > 1);
    sheetSummaries.push({
      sheetName: sheet.sheetName,
      headerRow: headerRow + 1,
      rowCount: rows.length,
      detectedRows: records.length,
      headers: headers.map(readCellText).filter(Boolean).slice(0, 18)
    });
    cooperationRecords.push(...records);
  }

  const byCreator = new Map();
  for (const record of cooperationRecords) {
    if (!byCreator.has(record.normalizedName)) {
      byCreator.set(record.normalizedName, {
        name: record.name,
        normalizedName: record.normalizedName,
        platforms: new Set(),
        links: new Set(),
        sheets: new Set(),
        rawRows: [],
        years: new Set(),
        hasPublishedSignal: false,
        hasSalesSignal: false
      });
    }
    const item = byCreator.get(record.normalizedName);
    if (record.platform) item.platforms.add(record.platform);
    if (record.link) item.links.add(record.link);
    item.sheets.add(record.sheetName);
    item.rawRows.push(record);
    item.matchKeys = new Set([...(item.matchKeys || []), ...(record.matchKeys || [])]);
    const year = parseYear(record);
    if (year) item.years.add(year);
    if (hasPublishedSignal(record)) item.hasPublishedSignal = true;
    if (hasSalesSignal(record)) item.hasSalesSignal = true;
  }

  const videos = await loadJson('videos');
  const influencers = await loadJson('influencers');
  const videoByCreator = new Map();
  const videoByMatchKey = new Map();
  for (const row of videos) {
    const fields = row.fields || row;
    const creator = getField(row, ['红人名称', 'creator', 'creatorUsername']);
    const key = normalizeName(creator);
    if (!key) continue;
    if (!videoByCreator.has(key)) videoByCreator.set(key, { count: 0, views: 0, latestAt: '', platforms: new Set(), urls: new Set() });
    const item = videoByCreator.get(key);
    item.count += 1;
    item.views += videoViews(fields);
    const time = readCellText(fields.timestamp);
    if (time && (!item.latestAt || new Date(time) > new Date(item.latestAt))) item.latestAt = time;
    const platform = getField(row, ['平台', 'platform']);
    const url = getField(row, ['url', '视频链接']);
    if (platform) item.platforms.add(platform);
    if (url) item.urls.add(url);
    const keys = new Set([key, ...extractMatchKeysFromUrl(url)]);
    for (const matchKey of keys) {
      if (!matchKey) continue;
      if (!videoByMatchKey.has(matchKey)) videoByMatchKey.set(matchKey, item);
    }
  }

  const localInfluencerByCreator = new Map();
  const localInfluencerByMatchKey = new Map();
  for (const row of influencers) {
    const creator = getField(row, ['红人名称', 'name']);
    const key = normalizeName(creator);
    if (!key) continue;
    const fields = row.fields || row;
    localInfluencerByCreator.set(key, fields);
    const profile = getField(row, ['红人链接', 'url', 'profile']);
    for (const matchKey of new Set([key, ...extractMatchKeysFromUrl(profile)])) {
      if (matchKey) localInfluencerByMatchKey.set(matchKey, fields);
    }
  }

  function findByAnyKey(map, item) {
    for (const key of item.matchKeys || []) {
      if (map.has(key)) return map.get(key);
    }
    return null;
  }

  const missingVideoRows = [];
  const missingInfluencerRows = [];
  const matchedInfluencerRows = [];
  const monitoringPreAuditRows = [];
  for (const item of byCreator.values()) {
    const localVideos = videoByCreator.get(item.normalizedName) || findByAnyKey(videoByMatchKey, item);
    const localInfluencer = localInfluencerByCreator.get(item.normalizedName) || findByAnyKey(localInfluencerByMatchKey, item);
    const years = [...item.years].sort((a, b) => a - b);
    const latestYear = years.length ? years[years.length - 1] : '';
    const localHasVideo = Boolean(localVideos?.count);
    if (!localHasVideo) {
      missingVideoRows.push({
        name: item.name,
        platforms: [...item.platforms].join(' / '),
        sheets: [...item.sheets].join(' / '),
        rows: item.rawRows.map((r) => `${r.sheetName}#${r.rowNumber}`).join('; '),
        latestYear,
        cooperationPublishedSignal: item.hasPublishedSignal ? '是' : '否/未知',
        salesSignal: item.hasSalesSignal ? '有出单信号' : '无/未知',
        localInfluencerRegistered: localInfluencer ? '已在红人库' : '红人库未登记',
        recommendedAction: item.hasPublishedSignal ? '核对视频链接是否漏导入' : '确认是否确实未发布，若今年合作需继续监控'
      });
    }
    const influencerAuditRow = {
      name: item.name,
      platforms: [...item.platforms].join(' / '),
      links: [...item.links].join(' / '),
      sheets: [...item.sheets].join(' / '),
      rows: item.rawRows.map((r) => `${r.sheetName}#${r.rowNumber}`).join('; '),
      latestYear,
      cooperationPublishedSignal: item.hasPublishedSignal ? '是' : '否/未知',
      salesSignal: item.hasSalesSignal ? '有出单信号' : '无/未知',
      localInfluencerRegistered: localInfluencer ? '已登记' : '缺少登记',
      recommendedAction: localInfluencer ? '无需补登红人表' : '补登记到本地红人表/监控达人表'
    };
    if (localInfluencer) matchedInfluencerRows.push(influencerAuditRow);
    else missingInfluencerRows.push(influencerAuditRow);
    const preliminaryMonitoring =
      item.hasSalesSignal ||
      (latestYear === 2026 && !localHasVideo) ||
      (latestYear === 2026 && localHasVideo && item.hasSalesSignal);
    monitoringPreAuditRows.push({
      name: item.name,
      latestYear,
      localVideoCount: localVideos?.count || 0,
      localViews: localVideos?.views || 0,
      latestVideoAt: localVideos?.latestAt || '',
      cooperationPublishedSignal: item.hasPublishedSignal ? '是' : '否/未知',
      salesSignal: item.hasSalesSignal ? '有出单信号' : '无/未知',
      preliminaryMonitoring: preliminaryMonitoring ? '暂保留候选' : '等出单名单确认后再判断',
      note:
        latestYear && latestYear < 2026 && localHasVideo && !item.hasSalesSignal
          ? '去年合作且已上线，若不在持续出单名单，建议不再监控'
          : '需与持续出单名单二次交叉'
    });
  }

  missingVideoRows.sort((a, b) => String(b.latestYear).localeCompare(String(a.latestYear)) || a.name.localeCompare(b.name));
  missingInfluencerRows.sort((a, b) => String(b.latestYear).localeCompare(String(a.latestYear)) || a.name.localeCompare(b.name));
  monitoringPreAuditRows.sort((a, b) => String(b.latestYear).localeCompare(String(a.latestYear)) || b.localVideoCount - a.localVideoCount);

  const outputDir = path.join(projectRoot, 'data', 'reports');
  await fs.mkdir(outputDir, { recursive: true });
  const reportJsonPath = path.join(outputDir, 'cooperation-video-audit.json');
  const missingCsvPath = path.join(outputDir, 'cooperation-missing-video-creators.csv');
  const missingInfluencerCsvPath = path.join(outputDir, 'cooperation-missing-influencer-creators.csv');
  const monitorCsvPath = path.join(outputDir, 'cooperation-monitoring-preaudit.csv');
  const mdPath = path.join(outputDir, 'cooperation-video-audit.md');

  await fs.writeFile(
    reportJsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        workbookPath,
        sheetSummaries,
        totals: {
          cooperationRows: cooperationRecords.length,
          cooperationCreators: byCreator.size,
          localVideoCreators: videoByCreator.size,
          missingVideoCreators: missingVideoRows.length,
          missingInfluencerCreators: missingInfluencerRows.length,
          matchedInfluencerCreators: matchedInfluencerRows.length,
          monitoringPreAuditRows: monitoringPreAuditRows.length
        },
        missingVideoRows,
        missingInfluencerRows,
        matchedInfluencerRows,
        monitoringPreAuditRows
      },
      null,
      2
    ),
    'utf8'
  );

  const writeCsv = async (filePath, rows, headers) => {
    const csv = [headers.join(',')]
      .concat(rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')))
      .join('\n');
    await fs.writeFile(filePath, `${csv}\n`, 'utf8');
  };

  await writeCsv(missingCsvPath, missingVideoRows, [
    'name',
    'platforms',
    'latestYear',
    'cooperationPublishedSignal',
    'salesSignal',
    'localInfluencerRegistered',
    'recommendedAction',
    'sheets',
    'rows'
  ]);
  await writeCsv(missingInfluencerCsvPath, missingInfluencerRows, [
    'name',
    'platforms',
    'latestYear',
    'cooperationPublishedSignal',
    'salesSignal',
    'localInfluencerRegistered',
    'recommendedAction',
    'links',
    'sheets',
    'rows'
  ]);
  await writeCsv(monitorCsvPath, monitoringPreAuditRows, [
    'name',
    'latestYear',
    'localVideoCount',
    'localViews',
    'latestVideoAt',
    'cooperationPublishedSignal',
    'salesSignal',
    'preliminaryMonitoring',
    'note'
  ]);

  const topMissing = missingVideoRows.slice(0, 30);
  const table = (rows) =>
    rows
      .map(
        (row) =>
          `| ${row.name} | ${row.platforms || '-'} | ${row.latestYear || '-'} | ${row.cooperationPublishedSignal} | ${row.salesSignal} | ${row.localInfluencerRegistered} | ${row.recommendedAction} |`
      )
      .join('\n');
  const md = `# 合作名单 × 本地视频数据对账

生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}

## 汇总

- 合作名单识别行数：${cooperationRecords.length}
- 合作名单去重达人：${byCreator.size}
- 合作名单已登记到本地红人表：${matchedInfluencerRows.length}
- 合作名单未登记到本地红人表：${missingInfluencerRows.length}
- 本地视频表已有视频达人：${videoByCreator.size}
- 合作名单中未在本地视频表登记视频的达人：${missingVideoRows.length}

## 工作表识别

${sheetSummaries
  .map((sheet) => `- ${sheet.sheetName}：识别 ${sheet.detectedRows} 行，表头第 ${sheet.headerRow} 行，字段：${sheet.headers.join(' / ')}`)
  .join('\n')}

## 合作名单中未登记本地视频的达人（前 30）

| 达人 | 平台 | 最近年份 | 合作表发布信号 | 出单信号 | 红人库状态 | 建议 |
|---|---|---:|---|---|---|---|
${table(topMissing)}

完整 CSV：${missingCsvPath}

## 合作名单中未登记到本地红人表的达人（前 30）

| 达人 | 平台 | 最近年份 | 合作表发布信号 | 出单信号 | 建议 |
|---|---|---:|---|---|---|
${missingInfluencerRows
  .slice(0, 30)
  .map((row) => `| ${row.name} | ${row.platforms || '-'} | ${row.latestYear || '-'} | ${row.cooperationPublishedSignal} | ${row.salesSignal} | ${row.recommendedAction} |`)
  .join('\n')}

完整 CSV：${missingInfluencerCsvPath}

## 监控规则预判

你的最终规则我理解为：
1. 持续出单的达人，即使是去年合作且已经上线，也继续监控。
2. 今年合作但未上线视频的达人，继续监控。
3. 今年合作且已上线，并且还在持续出单的达人，继续监控。
4. 已上线但不再出单的达人，不继续监控。
5. 去年合作且已上线的视频达人，如果不在持续出单名单里，建议不再监控其视频上线。

下一步需要你提供“持续出单达人名单”，我会把这份预判表二次交叉，输出最终“继续监控 / 停止监控 / 需人工确认”名单。
`;
  await fs.writeFile(mdPath, md, 'utf8');

  console.log(
    JSON.stringify(
      {
        totals: {
          cooperationRows: cooperationRecords.length,
          cooperationCreators: byCreator.size,
          localVideoCreators: videoByCreator.size,
          matchedInfluencerCreators: matchedInfluencerRows.length,
          missingInfluencerCreators: missingInfluencerRows.length,
          missingVideoCreators: missingVideoRows.length
        },
        sheetSummaries,
        sampleMissingInfluencers: missingInfluencerRows.slice(0, 20),
        sampleMissing: missingVideoRows.slice(0, 12),
        files: { reportJsonPath, missingCsvPath, missingInfluencerCsvPath, monitorCsvPath, mdPath }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
