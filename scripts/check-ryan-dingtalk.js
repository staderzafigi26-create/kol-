const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectDir = path.resolve(__dirname, '..');
const configPath = path.join(projectDir, 'config', 'ryan.env');
const config = dotenv.parse(fs.readFileSync(configPath));
const required = [
  'DINGTALK_APP_KEY',
  'DINGTALK_APP_SECRET',
  'DINGTALK_OPERATOR_ID',
  'DINGTALK_DOC_ID',
  'DINGTALK_INFLUENCER_TABLE_ID',
  'DINGTALK_VIDEO_TABLE_ID',
  'DINGTALK_SNAPSHOT_TABLE_ID'
];
const missing = required.filter((key) => !String(config[key] || '').trim());

if (missing.length) {
  console.error(`Ryan 配置还未填完整：${missing.join(', ')}`);
  console.error(`请编辑：${configPath}`);
  process.exit(1);
}

async function main() {
  const response = await fetch('http://127.0.0.1:3000/api/workflow/sync-dingtalk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appKey: config.DINGTALK_APP_KEY,
      appSecret: config.DINGTALK_APP_SECRET,
      operatorId: config.DINGTALK_OPERATOR_ID,
      baseId: config.DINGTALK_DOC_ID,
      influencerTableId: config.DINGTALK_INFLUENCER_TABLE_ID,
      videoTableId: config.DINGTALK_VIDEO_TABLE_ID,
      snapshotTableId: config.DINGTALK_SNAPSHOT_TABLE_ID,
      dryRun: true
    })
  });
  const body = await response.json();
  if (!response.ok || !body.ok) {
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  console.log(body.message);
  console.log(JSON.stringify(body.tables, null, 2));
}

main().catch((error) => {
  console.error(`检查失败：${error.message}`);
  process.exit(1);
});
