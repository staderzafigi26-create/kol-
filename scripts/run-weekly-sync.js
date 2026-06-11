#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..');
const SETTINGS_PATH = path.join(ROOT, '抓取设置.env');
const LOG_PATH = path.join(ROOT, 'data', 'logs', 'weekly-sync.log');

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function writeLog(payload) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, `${JSON.stringify({ time: new Date().toISOString(), ...payload })}\n`);
}

function startOfCurrentReportWeek(date = new Date()) {
  const dayOffset = (date.getDay() + 1) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOffset, 0, 0, 0, 0);
}

async function main() {
  const settings = dotenv.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  const dryRun = process.argv.includes('--dry-run');
  const publishedBefore = startOfCurrentReportWeek().toISOString();
  const payload = {
    days: positiveInt(settings.SYNC_DAYS, 7),
    maxItems: positiveInt(settings.SYNC_MAX_ITEMS_PER_INFLUENCER, 30),
    limitInfluencers: positiveInt(settings.SYNC_LIMIT_INFLUENCERS, 200),
    platformFilter: settings.SYNC_PLATFORM_FILTER || 'all',
    globalKeywords: settings.SYNC_GLOBAL_KEYWORDS || 'yozma,yozmasport',
    publishedBefore,
    dryRun
  };

  const health = await fetch('http://127.0.0.1:3000/api/health');
  if (!health.ok) throw new Error('本地抓取服务未启动');

  const response = await fetch('http://127.0.0.1:3000/api/workflow/sync-dingtalk', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.ok) throw new Error(json.error || `同步失败: HTTP ${response.status}`);

  const summary = {
    ok: true,
    settings: payload,
    dryRun,
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
