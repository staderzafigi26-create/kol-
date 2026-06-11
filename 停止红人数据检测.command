#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SERVICE="com.yozma.influencer-tracker"
DOMAIN="gui/$(id -u)"

if ! launchctl print "$DOMAIN/$SERVICE" >/dev/null 2>&1; then
  echo "No managed local server is running."
  exit 0
fi

launchctl bootout "$DOMAIN/$SERVICE"
echo "Influencer tracking tool stopped."
