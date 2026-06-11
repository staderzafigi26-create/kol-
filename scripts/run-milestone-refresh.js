#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_PATH = path.join(ROOT, 'data', 'logs', 'milestone-refresh.log');

function writeLog(payload) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, `${JSON.stringify({ time: new Date().toISOString(), ...payload })}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJsonWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) throw new Error(json.error || `请求失败: HTTP ${response.status}`);
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(attempt * 2000);
    }
  }
  throw lastError;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await requestJsonWithRetry('http://127.0.0.1:3000/api/health');

  const json = await requestJsonWithRetry('http://127.0.0.1:3000/api/workflow/refresh-dingtalk-milestones', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dryRun })
  });

  const summary = {
    ok: true,
    dryRun,
    message: json.message,
    due: json.due || [],
    refreshed: json.refreshed || 0,
    report: json.report || []
  };
  writeLog(summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  writeLog({ ok: false, error: error.message });
  console.error(error.message);
  process.exit(1);
});
