const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectDir = path.resolve(__dirname, '..');
const targetPath = path.join(projectDir, '.env');
const sourcePath = path.join(projectDir, 'config', 'ryan.env');
const source = dotenv.parse(fs.readFileSync(sourcePath));
const keys = [
  'DINGTALK_APP_KEY',
  'DINGTALK_APP_SECRET',
  'DINGTALK_OPERATOR_ID',
  'DINGTALK_DOC_ID',
  'DINGTALK_INFLUENCER_TABLE_ID',
  'DINGTALK_VIDEO_TABLE_ID',
  'DINGTALK_SNAPSHOT_TABLE_ID'
];
const missing = keys.filter((key) => !String(source[key] || '').trim());

if (missing.length) {
  console.error(`Ryan 配置还未填完整：${missing.join(', ')}`);
  process.exit(1);
}

const original = fs.readFileSync(targetPath, 'utf8');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `${targetPath}.backup-${stamp}`;
let updated = original;

for (const key of keys) {
  const line = `${key}=${source[key]}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  updated = pattern.test(updated) ? updated.replace(pattern, line) : `${updated.trimEnd()}\n${line}\n`;
}

fs.copyFileSync(targetPath, backupPath);
fs.writeFileSync(targetPath, updated);
console.log(`Ryan 配置已写入：${targetPath}`);
console.log(`原配置备份：${backupPath}`);
