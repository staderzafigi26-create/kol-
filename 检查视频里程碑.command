#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

/usr/local/bin/node scripts/run-milestone-refresh.js --dry-run

echo
echo "里程碑检查完成。此命令不会调用 Apify。按回车键关闭窗口。"
read
