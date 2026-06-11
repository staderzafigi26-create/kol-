#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

mkdir -p data/raw data/output data/logs

SERVICE="com.yozma.influencer-tracker"
DOMAIN="gui/$(id -u)"
PLIST="$HOME/Library/LaunchAgents/$SERVICE.plist"

if ! launchctl print "$DOMAIN/$SERVICE" >/dev/null 2>&1; then
  launchctl bootstrap "$DOMAIN" "$PLIST"
else
  launchctl kickstart -k "$DOMAIN/$SERVICE" >/dev/null 2>&1 &
fi

for _ in {1..10}; do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
  echo "Startup failed. Check data/logs/server.err.log."
  exit 1
fi

echo "Influencer tracking tool is running at http://127.0.0.1:3000"
if [[ "${NO_OPEN:-0}" != "1" ]]; then
  open http://127.0.0.1:3000
fi
