#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..');
const SETTINGS_PATH = path.join(ROOT, '抓取设置.env');
const LOG_PATH = path.join(ROOT, 'data', 'logs', 'weekly-sync.log');
const CURSOR_PATH = path.join(ROOT, 'data', 'local', 'weekly-sync-cursor.json');

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function writeLog(payload) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, `${JSON.stringify({ time: new Date().toISOString(), ...payload })}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/health');
      if (response.ok) return;
      lastError = new Error(`本地抓取服务健康检查失败: HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await sleep(attempt * 2000);
  }
  throw lastError || new Error('本地抓取服务未启动');
}

function readCursor(publishedBefore) {
  try {
    const cursor = JSON.parse(fs.readFileSync(CURSOR_PATH, 'utf8'));
    return cursor.publishedBefore === publishedBefore ? positiveInt(cursor.skipInfluencers, 0) : 0;
  } catch (_error) {
    return 0;
  }
}

function writeCursor(payload) {
  fs.mkdirSync(path.dirname(CURSOR_PATH), { recursive: true });
  fs.writeFileSync(CURSOR_PATH, JSON.stringify(payload, null, 2));
}

async function requestSync(payload) {
  const response = await fetch('http://127.0.0.1:3000/api/workflow/sync-dingtalk', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.ok) throw new Error(json.error || `同步失败: HTTP ${response.status}`);
  return json;
}

function startOfCurrentReportWeek(date = new Date()) {
  const chinaOffsetMs = 8 * 60 * 60 * 1000;
  const chinaDate = new Date(date.getTime() + chinaOffsetMs);
  const sundayOffset = chinaDate.getUTCDay();
  const startUtc = Date.UTC(
    chinaDate.getUTCFullYear(),
    chinaDate.getUTCMonth(),
    chinaDate.getUTCDate() - sundayOffset,
    0,
    0,
    0,
    0
  ) - chinaOffsetMs;
  return new Date(startUtc);
}

async function main() {
  const settings = dotenv.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  const dryRun = process.argv.includes('--dry-run');
  const publishedBefore = startOfCurrentReportWeek().toISOString();
  const skipInfluencers = readCursor(publishedBefore);
  const payload = {
    days: positiveInt(settings.SYNC_DAYS, 7),
    maxItems: positiveInt(settings.SYNC_MAX_ITEMS_PER_INFLUENCER, 30),
    limitInfluencers: positiveInt(settings.SYNC_LIMIT_INFLUENCERS, 200),
    platformFilter: settings.SYNC_PLATFORM_FILTER || 'all',
    globalKeywords: settings.SYNC_GLOBAL_KEYWORDS || 'yozma,yozmasport',
    publishedBefore,
    skipInfluencers,
    dryRun
  };

  await waitForHealth();
  const preflight = await requestSync({ ...payload, dryRun: true });
  const json = dryRun || Number(preflight.candidateAudit?.queuedRows || 0) === 0
    ? preflight
    : await requestSync({ ...payload, dryRun: false });

  const completed = (json.report || []).filter((row) => !row.blockedReason && !row.error).length;
  const queued = Number(preflight.candidateAudit?.queuedRows || 0);
  const targeted = Number(preflight.candidateAudit?.targetedRows || queued);
  const hasMore = skipInfluencers + queued < targeted;
  if (!dryRun && (json.blockedReason || hasMore) && completed > 0) {
    writeCursor({ publishedBefore, skipInfluencers: skipInfluencers + completed, blockedReason: json.blockedReason, updatedAt: new Date().toISOString() });
  } else if (!dryRun && !json.blockedReason) {
    writeCursor({ publishedBefore, skipInfluencers: 0, completed: true, updatedAt: new Date().toISOString() });
  }

  const summary = {
    ok: true,
    settings: payload,
    dryRun,
    preflight: { candidateAudit: preflight.candidateAudit, usageEstimate: preflight.usageEstimate, usageBudget: preflight.usageBudget },
    blockedReason: json.blockedReason || '',
    usageBudget: json.usageBudget || preflight.usageBudget,
    processedInfluencers: json.processedInfluencers || 0,
    report: (json.report || []).map((item) => ({
      platform: item.platform,
      influencerInput: item.influencerInput,
      scraped: item.scraped,
      matched: item.matched,
      videoCreated: item.videoCreated,
      videoUpdated: item.videoUpdated,
      snapshotCreated: item.snapshotCreated
    }))
  };
  writeLog(summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  writeLog({ ok: false, error: error.message });
  console.error(error.message);
  process.exit(1);
});
