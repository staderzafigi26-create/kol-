#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

/usr/local/bin/node scripts/check-ryan-dingtalk.js
echo
echo "检查完成。按回车键关闭窗口。"
read
