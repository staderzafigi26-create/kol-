#!/bin/zsh
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
NO_OPEN=0 "$SCRIPT_DIR/启动红人数据检测.command"
