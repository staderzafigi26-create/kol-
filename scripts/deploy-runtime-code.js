#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sourceRoot = path.resolve(__dirname, '..');
const runtimeRoot = process.env.YOZMA_TRACKER_RUNTIME || '/Users/ryan/Documents/项目编程/runtime/红人数据检测追踪工具';
const checkOnly = process.argv.includes('--check');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const tracked = execFileSync('git', ['-C', sourceRoot, 'ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((relative) => !relative.startsWith('data/'))
  .filter((relative) => !/(^|\/)\.env(?:\.|$)/.test(relative))
  .filter((relative) => relative !== '抓取设置.env');

const mismatches = [];
for (const relative of tracked) {
  const source = path.join(sourceRoot, relative);
  const target = path.join(runtimeRoot, relative);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) continue;
  if (!fs.existsSync(target) || sha256(source) !== sha256(target)) mismatches.push(relative);
  if (!checkOnly) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

const remaining = mismatches.filter((relative) => {
  const source = path.join(sourceRoot, relative);
  const target = path.join(runtimeRoot, relative);
  return !fs.existsSync(target) || sha256(source) !== sha256(target);
});

const result = { ok: checkOnly ? mismatches.length === 0 : remaining.length === 0, mode: checkOnly ? 'check' : 'deploy', sourceRoot, runtimeRoot, trackedFiles: tracked.length, changedFiles: mismatches, remainingMismatches: remaining, dataDirectoryTouched: false };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
