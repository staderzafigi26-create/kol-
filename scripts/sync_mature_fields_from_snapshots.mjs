import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const VIDEOS_PATH = path.join(ROOT, 'data/local/videos.json');
const SNAPSHOTS_PATH = path.join(ROOT, 'data/local/snapshots.json');
const REPORT_DIR = path.join(ROOT, 'data/reports');

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') return value.link || value.text || '';
  return String(value);
}

function normalizePlatform(value) {
  const s = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('instagram')) return 'instagramreels';
  if (s.includes('youtube') && s.includes('short')) return 'youtubeshort';
  if (s.includes('youtube')) return 'youtubevideo';
  return s;
}

function toNumber(value, defaultValue = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return defaultValue;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : defaultValue;
}

function postKeyOf(fields) {
  const platform = normalizePlatform(fields['平台'] || fields.platform);
  const postId = String(fields.id || '').trim();
  const url = text(fields.url).trim();
  return postId ? `${platform}_${postId}` : `${platform}_${url}`;
}

function snapshotViews(fields) {
  return Math.max(toNumber(fields.videoPlayCount, 0), toNumber(fields.videoViewCount, 0));
}

await fs.mkdir(REPORT_DIR, { recursive: true });

const videos = JSON.parse(await fs.readFile(VIDEOS_PATH, 'utf8'));
const snapshots = JSON.parse(await fs.readFile(SNAPSHOTS_PATH, 'utf8'));

const latestByType = new Map();
for (const snapshot of snapshots) {
  const fields = snapshot.fields || snapshot;
  const postKey = String(fields.postKey || '').trim();
  const snapshotType = String(fields.snapshotType || '').trim();
  if (!postKey || !['milestone_7d', 'milestone_30d'].includes(snapshotType)) continue;
  const key = `${postKey}__${snapshotType}`;
  const capturedAt = toNumber(fields.capturedAt, 0);
  const previous = latestByType.get(key);
  if (!previous || capturedAt >= previous.capturedAt) {
    latestByType.set(key, { capturedAt, fields });
  }
}

const updates = [];
for (const video of videos) {
  const fields = video.fields || video;
  const postKey = postKeyOf(fields);
  if (!postKey) continue;

  for (const [snapshotType, fieldName] of [
    ['milestone_7d', '7日成熟声量'],
    ['milestone_30d', '30日成熟声量']
  ]) {
    const snapshot = latestByType.get(`${postKey}__${snapshotType}`);
    if (!snapshot) continue;
    const value = snapshotViews(snapshot.fields);
    if (!value) continue;
    const before = toNumber(fields[fieldName], 0);
    if (before !== value) {
      fields[fieldName] = value;
      video.updatedAt = new Date().toISOString();
      updates.push({
        creator: fields['红人名称'] || '',
        platform: fields['平台'] || '',
        postKey,
        fieldName,
        before,
        after: value,
        delta: value - before,
        url: text(fields.url)
      });
    }
  }
}

if (updates.length) {
  await fs.writeFile(VIDEOS_PATH, JSON.stringify(videos, null, 2));
}

const reportPath = path.join(REPORT_DIR, `mature-fields-sync-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
await fs.writeFile(reportPath, JSON.stringify({
  ok: true,
  updated: updates.length,
  reportPath,
  updates
}, null, 2));

console.log(JSON.stringify({ ok: true, updated: updates.length, reportPath, topUpdates: updates.slice(0, 10) }, null, 2));
