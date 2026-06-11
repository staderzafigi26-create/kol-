#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

/usr/local/bin/node scripts/run-weekly-sync.js

echo
echo "本次抓取已完成。按回车键关闭窗口。"
read
