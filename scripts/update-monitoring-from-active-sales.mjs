import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cooperationPath = process.argv[2] || '/Users/ryan/Downloads/Yozma-红人营销总表 (3).xlsx';
const activeSalesPath = process.argv[3] || '/Users/ryan/Downloads/目前正在出单达人.xlsx';

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') return String(value.text || value.name || value.value || value.link || '').trim();
  return String(value).trim();
}

function norm(value) {
  return text(value)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, ' ')
    .replace(/[，,。./\\|:：;；()[\]{}'"“”‘’]+/g, '')
    .trim();
}

function emailKeys(value) {
  return [...text(value).toLowerCase().matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g)].map((m) => m[0]);
}

function inferPlatformFromUrl(value) {
  const raw = text(value).toLowerCase();
  if (raw.includes('tiktok.com')) return 'TikTok';
  if (raw.includes('instagram.com')) return 'Instagram';
  if (raw.includes('youtube.com') || raw.includes('youtu.be')) return raw.includes('/shorts/') ? 'YouTube Shorts' : 'YouTube';
  return '';
}

function localPlatformFromLabel(label, link = '') {
  const raw = `${label} ${link}`.toLowerCase();
  if (raw.includes('tiktok')) return 'tiktok';
  if (raw.includes('instagram')) return 'instagramreels';
  if (raw.includes('short')) return 'youtubeshort';
  if (raw.includes('youtube') || raw.includes('youtu.be')) return 'youtubevideo';
  return '';
}

function pickProfileLink(links) {
  const list = Array.isArray(links) ? links : String(links || '').split(' / ');
  return (
    list.find((link) => /^https?:\/\/[^ ]+\/@[^/]+\/?(?:[?#].*)?$/i.test(text(link))) ||
    list.find((link) => /^https?:\/\//i.test(text(link)) && !/\/(?:video|watch|reel|p)\//i.test(text(link)) && !/[?&]v=/i.test(text(link))) ||
    list.find((link) => /^https?:\/\//i.test(text(link))) ||
    ''
  );
}

function stableIdFrom(value) {
  let hash = 0;
  const raw = String(value || '');
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return `active_${hash.toString(36)}`;
}

function keysFromUrl(rawValue) {
  const raw = text(rawValue);
  const keys = [];
  if (!/^https?:\/\//i.test(raw)) return keys;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    if (host.includes('tiktok.com')) {
      const handle = parts.find((part) => part.startsWith('@'));
      if (handle) keys.push(norm(handle));
    }
    if (host.includes('instagram.com')) {
      const blocked = new Set(['p', 'reel', 'reels', 'tv', 'stories']);
      const handle = parts.find((part) => !blocked.has(part.toLowerCase()));
      if (handle) keys.push(norm(handle));
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const atHandle = parts.find((part) => part.startsWith('@'));
      if (atHandle) keys.push(norm(atHandle));
      for (let i = 1; i < parts.length; i += 1) {
        if (['channel', 'c', 'user'].includes((parts[i - 1] || '').toLowerCase())) keys.push(norm(parts[i]));
      }
    }
  } catch {}
  return [...new Set(keys.filter(Boolean))];
}

function headerKey(header) {
  const h = text(header).toLowerCase();
  if (/编码|code|联盟/.test(h)) return '';
  if (/链接|主页|profile|url|link|账号链接/.test(h)) return 'link';
  if (/^名字$|姓名|昵称|红人名称|达人名称|kol名称|influencer name|creator name|affiliate name|账号名称|账号名|name/.test(h)) return 'name';
  if (/email|邮箱|mail/.test(h)) return 'email';
  if (/联系方式|contact/.test(h)) return 'contact';
  if (/平台|platform/.test(h)) return 'platform';
  if (/状态|进度|合作阶段|合作情况|是否合作|status/.test(h)) return 'status';
  if (/时间|日期|年份|合作时间|寄样时间|date|year/.test(h)) return 'date';
  if (/视频|上线|发布|post|deliverable/.test(h)) return 'videoStatus';
  if (/出单|订单|销售|sales|order/.test(h)) return 'sales';
  return '';
}

function findHeaderRow(rows) {
  let best = { index: 0, score: 0 };
  rows.slice(0, 20).forEach((row, index) => {
    const joined = row.map(text).join('|').toLowerCase();
    let score = 0;
    if (/红人|达人|kol|influencer|affiliate|名字|name/.test(joined)) score += 3;
    if (/email|邮箱|联系方式|contact/.test(joined)) score += 2;
    if (/链接|主页|url|link/.test(joined)) score += 2;
    if (/合作|状态|时间|date|status/.test(joined)) score += 1;
    if (score > best.score) best = { index, score };
  });
  return best.index;
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

function parseYear(record) {
  const all = [record.date, record.status, record.videoStatus, record.sales, ...Object.values(record.raw || {})].join(' ');
  const match = all.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function hasPublishedSignal(record) {
  const all = [record.videoStatus, record.status, ...Object.values(record.raw || {})].join(' ');
  return /已发|已发布|已上线|posted|published|上线/i.test(all) && !/未发|未发布|待发布|未上线/i.test(all);
}

function parseRowsToRecords(sheets) {
  const records = [];
  for (const sheet of sheets) {
    if (!sheet.rows.length) continue;
    const headerIndex = findHeaderRow(sheet.rows);
    const headers = sheet.rows[headerIndex] || [];
    sheet.rows.slice(headerIndex + 1).forEach((row, index) => {
      const record = { sheetName: sheet.sheetName, rowNumber: headerIndex + index + 2, raw: {}, links: [], keys: new Set(), emails: new Set() };
      headers.forEach((header, cellIndex) => {
        const label = text(header);
        const value = text(row[cellIndex]);
        if (!label || !value) return;
        record.raw[label] = value;
        const key = headerKey(label);
        if (key === 'link') record.links.push(value);
        else if (key === 'email' || key === 'contact') emailKeys(value).forEach((email) => record.emails.add(email));
        else if (key && !record[key]) record[key] = value;
      });
      const linkKeys = record.links.flatMap(keysFromUrl);
      if (!record.name && linkKeys.length) record.name = linkKeys[0];
      record.name = text(record.name);
      record.normalizedName = norm(record.name);
      if (record.normalizedName) record.keys.add(record.normalizedName);
      linkKeys.forEach((key) => record.keys.add(key));
      Object.values(record.raw).forEach((value) => emailKeys(value).forEach((email) => record.emails.add(email)));
      record.platform = text(record.platform) || [...new Set(record.links.map(inferPlatformFromUrl).filter(Boolean))].join(' / ');
      record.date = text(record.date);
      record.status = text(record.status);
      record.videoStatus = text(record.videoStatus);
      record.sales = text(record.sales);
      record.year = parseYear(record);
      record.hasPublishedSignal = hasPublishedSignal(record);
      record.keys = [...record.keys].filter(Boolean);
      record.emails = [...record.emails].filter(Boolean);
      if (record.normalizedName || record.keys.length || record.emails.length) records.push(record);
    });
  }
  return records;
}

function mergeCooperationRecords(records) {
  const map = new Map();
  for (const record of records) {
    const primary = record.normalizedName || record.keys[0] || record.emails[0];
    if (!primary) continue;
    if (!map.has(primary)) {
      map.set(primary, {
        name: record.name || primary,
        normalizedName: primary,
        keys: new Set(),
        emails: new Set(),
        links: new Set(),
        platforms: new Set(),
        years: new Set(),
        rows: [],
        hasPublishedSignal: false
      });
    }
    const item = map.get(primary);
    record.keys.forEach((key) => item.keys.add(key));
    record.emails.forEach((email) => item.emails.add(email));
    record.links.forEach((link) => item.links.add(link));
    if (record.platform) item.platforms.add(record.platform);
    if (record.year) item.years.add(record.year);
    item.rows.push(`${record.sheetName}#${record.rowNumber}`);
    item.hasPublishedSignal ||= record.hasPublishedSignal;
  }
  return [...map.values()].map((item) => ({
    ...item,
    keys: [...item.keys],
    emails: [...item.emails],
    links: [...item.links],
    platforms: [...item.platforms],
    years: [...item.years].sort((a, b) => a - b),
    latestYear: item.years.size ? Math.max(...item.years) : null,
    rows: item.rows
  }));
}

async function loadLocal(name) {
  return JSON.parse(await fs.readFile(path.join(projectRoot, 'data', 'local', `${name}.json`), 'utf8'));
}

function getField(row, names) {
  const fields = row.fields || row;
  for (const name of names) {
    const value = fields[name];
    const valueText = text(value);
    if (valueText) return valueText;
  }
  return '';
}

function videoViews(fields) {
  return Math.max(Number(fields.videoPlayCount) || 0, Number(fields.videoViewCount) || 0, Number(fields.views) || 0);
}

function indexLocalInfluencers(rows) {
  const byKey = new Map();
  rows.forEach((row, index) => {
    const fields = row.fields || row;
    const name = getField(row, ['红人名称', 'name']);
    const link = getField(row, ['红人链接', 'url', 'profile']);
    const keys = new Set([norm(name), ...keysFromUrl(link)].filter(Boolean));
    for (const key of keys) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ row, index, fields, name, link });
    }
  });
  return byKey;
}

function indexLocalVideos(rows) {
  const byKey = new Map();
  rows.forEach((row) => {
    const fields = row.fields || row;
    const creator = getField(row, ['红人名称', 'creator', 'creatorUsername']);
    const url = getField(row, ['url', '视频链接']);
    const keys = new Set([norm(creator), ...keysFromUrl(url)].filter(Boolean));
    for (const key of keys) {
      if (!byKey.has(key)) byKey.set(key, { count: 0, views: 0, latestAt: '' });
      const item = byKey.get(key);
      item.count += 1;
      item.views += videoViews(fields);
      const time = text(fields.timestamp);
      if (time && (!item.latestAt || new Date(time) > new Date(item.latestAt))) item.latestAt = time;
    }
  });
  return byKey;
}

function findFirst(index, keys) {
  for (const key of keys || []) {
    const value = index.get(key);
    if (Array.isArray(value) && value.length) return value[0];
    if (value) return value;
  }
  return null;
}

function findAll(index, keys) {
  const seen = new Set();
  const out = [];
  for (const key of keys || []) {
    const rows = index.get(key) || [];
    for (const row of rows) {
      if (seen.has(row.index)) continue;
      seen.add(row.index);
      out.push(row);
    }
  }
  return out;
}

function csvEscape(value) {
  const raw = String(value ?? '');
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

async function main() {
  const cooperationRecords = mergeCooperationRecords(parseRowsToRecords(await worksheetRows(cooperationPath)));
  const salesRecords = parseRowsToRecords(await worksheetRows(activeSalesPath));
  const activeSalesNames = new Set();
  const activeSalesEmails = new Set();
  for (const record of salesRecords) {
    if (record.normalizedName) activeSalesNames.add(record.normalizedName);
    record.keys.forEach((key) => activeSalesNames.add(key));
    record.emails.forEach((email) => activeSalesEmails.add(email));
  }

  const influencers = await loadLocal('influencers');
  const videos = await loadLocal('videos');
  const localInfluencerIndex = indexLocalInfluencers(influencers);
  const localVideoIndex = indexLocalVideos(videos);

  const activeSalesCooperationKeys = new Set();
  const activeSalesCooperationEmails = new Set();
  const cooperationByKey = new Map();
  for (const coop of cooperationRecords) {
    coop.keys.forEach((key) => cooperationByKey.set(key, coop));
    const byName = coop.keys.some((key) => activeSalesNames.has(key));
    const byEmail = coop.emails.some((email) => activeSalesEmails.has(email));
    if (byName || byEmail) {
      coop.keys.forEach((key) => activeSalesCooperationKeys.add(key));
      coop.emails.forEach((email) => activeSalesCooperationEmails.add(email));
    }
  }

  const directActiveLocalRows = [];
  for (const activeName of activeSalesNames) {
    directActiveLocalRows.push(...findAll(localInfluencerIndex, [activeName]));
  }

  const shouldMonitorIndexes = new Set();
  const decisions = [];
  const missingNeedMonitor = [];
  const activeSalesUnmatched = [];

  for (const coop of cooperationRecords) {
    const activeSales = coop.keys.some((key) => activeSalesCooperationKeys.has(key)) || coop.emails.some((email) => activeSalesCooperationEmails.has(email));
    const localVideo = findFirst(localVideoIndex, coop.keys);
    const localVideoCount = localVideo?.count || 0;
    const localRows = findAll(localInfluencerIndex, coop.keys);
    const isThisYear = coop.latestYear === 2026;
    const shouldMonitor = activeSales || (isThisYear && localVideoCount === 0);
    const reason = activeSales
      ? '目前正在出单，继续监控'
      : isThisYear && localVideoCount === 0
        ? '今年合作且本地未登记视频，继续监控上线'
        : localVideoCount > 0
          ? '已上线且未在出单名单，建议不作为主要监控对象'
          : '非今年合作且未在出单名单，暂不作为主要监控对象';
    if (shouldMonitor && !localRows.length) {
      missingNeedMonitor.push({
        name: coop.name,
        platforms: coop.platforms.join(' / '),
        latestYear: coop.latestYear || '',
        reason,
        links: coop.links.join(' / '),
        rows: coop.rows.join('; ')
      });
    }
    for (const local of localRows) {
      if (shouldMonitor) shouldMonitorIndexes.add(local.index);
      decisions.push({
        name: local.name || coop.name,
        localIndex: local.index,
        platforms: coop.platforms.join(' / ') || getField(local.row, ['平台']),
        latestYear: coop.latestYear || '',
        localVideoCount,
        localViews: localVideo?.views || 0,
        activeSales: activeSales ? '是' : '否',
        shouldMonitor: shouldMonitor ? '是' : '否',
        reason,
        link: local.link || coop.links[0] || ''
      });
    }
  }

  // Active sales names that match local rows directly but did not appear in the cooperation table still need monitoring.
  for (const local of directActiveLocalRows) {
    if (!shouldMonitorIndexes.has(local.index)) {
      shouldMonitorIndexes.add(local.index);
      decisions.push({
        name: local.name,
        localIndex: local.index,
        platforms: getField(local.row, ['平台']),
        latestYear: '',
        localVideoCount: 0,
        localViews: 0,
        activeSales: '是',
        shouldMonitor: '是',
        reason: '出单表直接匹配到本地红人表，继续监控',
        link: local.link
      });
    }
  }

  for (const record of salesRecords) {
    const localRows = findAll(localInfluencerIndex, record.keys);
    const coopMatch = record.keys.some((key) => cooperationByKey.has(key)) || record.emails.some((email) => activeSalesCooperationEmails.has(email));
    if (!localRows.length && !coopMatch) {
      activeSalesUnmatched.push({
        name: record.name,
        email: record.emails.join(' / '),
        sheetRow: `${record.sheetName}#${record.rowNumber}`,
        note: '出单表有，但未匹配到合作名单或本地红人表；可能是联盟昵称与达人账号不同'
      });
    }
  }

  const beforeYes = influencers.filter((row) => text((row.fields || row)['是否监控']) === '是').length;
  const addedRows = [];
  for (const row of missingNeedMonitor) {
    const profileLink = pickProfileLink(row.links);
    if (!profileLink) continue;
    const platform = localPlatformFromLabel(row.platforms, profileLink);
    const newRow = {
      id: stableIdFrom(`${row.name}|${profileLink}`),
      fields: {
        是否监控: '是',
        红人链接: { link: profileLink, text: profileLink },
        平台: platform || row.platforms || '',
        是否出视频: '否',
        红人名称: row.name,
        样品型号: 'yozma, yozmasport，in10'
      },
      source: 'active-sales-monitoring',
      importedAt: new Date().toISOString(),
      note: row.reason
    };
    const newIndex = influencers.length;
    influencers.push(newRow);
    shouldMonitorIndexes.add(newIndex);
    addedRows.push({
      name: row.name,
      platform: newRow.fields['平台'],
      link: profileLink,
      reason: row.reason
    });
  }
  const changedRows = [];
  influencers.forEach((row, index) => {
    const fields = row.fields || row;
    const next = shouldMonitorIndexes.has(index) ? '是' : '否';
    const prev = text(fields['是否监控']) || '';
    if (prev !== next) {
      changedRows.push({
        index,
        name: getField(row, ['红人名称']),
        previous: prev,
        next
      });
      fields['是否监控'] = next;
    }
  });

  const backupPath = path.join(projectRoot, 'data', 'local', `influencers.backup-before-active-sales-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(backupPath, JSON.stringify(await loadLocal('influencers'), null, 2), 'utf8');
  await fs.writeFile(path.join(projectRoot, 'data', 'local', 'influencers.json'), JSON.stringify(influencers, null, 2), 'utf8');

  const outputDir = path.join(projectRoot, 'data', 'reports');
  await fs.mkdir(outputDir, { recursive: true });
  const monitorListPath = path.join(outputDir, 'final-monitoring-creators.csv');
  const missingPath = path.join(outputDir, 'active-sales-missing-need-monitor.csv');
  const unmatchedPath = path.join(outputDir, 'active-sales-unmatched.csv');
  const summaryPath = path.join(outputDir, 'active-sales-monitoring-summary.json');

  const writeCsv = async (filePath, rows, headers) => {
    const csv = [headers.join(',')]
      .concat(rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')))
      .join('\n');
    await fs.writeFile(filePath, `${csv}\n`, 'utf8');
  };

  const monitorRows = decisions.filter((row) => row.shouldMonitor === '是');
  await writeCsv(monitorListPath, monitorRows, ['name', 'platforms', 'latestYear', 'localVideoCount', 'localViews', 'activeSales', 'shouldMonitor', 'reason', 'link']);
  await writeCsv(missingPath, missingNeedMonitor, ['name', 'platforms', 'latestYear', 'reason', 'links', 'rows']);
  await writeCsv(unmatchedPath, activeSalesUnmatched, ['name', 'email', 'sheetRow', 'note']);
  await fs.writeFile(
    summaryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        beforeMonitorYes: beforeYes,
        afterMonitorYes: shouldMonitorIndexes.size,
        changedRows: changedRows.length,
        monitorRows: monitorRows.length,
        missingNeedMonitor: missingNeedMonitor.length,
        activeSalesUniqueNames: activeSalesNames.size,
        activeSalesUniqueEmails: activeSalesEmails.size,
        activeSalesUnmatched: activeSalesUnmatched.length,
        addedRows: addedRows.length,
        backupPath,
        monitorListPath,
        missingPath,
        unmatchedPath,
        changedSample: changedRows.slice(0, 30),
        addedSample: addedRows.slice(0, 30),
        monitorSample: monitorRows.slice(0, 30),
        missingNeedMonitorSample: missingNeedMonitor.slice(0, 30),
        activeSalesUnmatchedSample: activeSalesUnmatched.slice(0, 30)
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(
    JSON.stringify(
      {
        beforeMonitorYes: beforeYes,
        afterMonitorYes: shouldMonitorIndexes.size,
        changedRows: changedRows.length,
        monitorRows: monitorRows.length,
        missingNeedMonitor: missingNeedMonitor.length,
        activeSalesUniqueNames: activeSalesNames.size,
        activeSalesUniqueEmails: activeSalesEmails.size,
        activeSalesUnmatched: activeSalesUnmatched.length,
        addedRows: addedRows.length,
        files: { backupPath, monitorListPath, missingPath, unmatchedPath, summaryPath },
        addedSample: addedRows.slice(0, 20),
        monitorSample: monitorRows.slice(0, 20),
        missingNeedMonitorSample: missingNeedMonitor.slice(0, 20)
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
