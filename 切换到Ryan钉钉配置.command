#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

/usr/local/bin/node scripts/check-ryan-dingtalk.js
/usr/local/bin/node scripts/switch-to-ryan-config.js
NO_OPEN=1 "$SCRIPT_DIR/启动红人数据检测.command"

echo
echo "已切换到 Ryan 自有钉钉链路。按回车键关闭窗口。"
read
