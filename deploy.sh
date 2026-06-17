#!/bin/bash

set -e

RUN_MIGRATE=false
for arg in "$@"; do
  case $arg in
    --migrate) RUN_MIGRATE=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

export NODE_OPTIONS="--max-old-space-size=512"

run() { echo "running: $*"; "$@"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "── pulling ──"
run git -C "$REPO_ROOT" pull

echo "── api ──"
cd "$REPO_ROOT/api"
run npm install
if $RUN_MIGRATE; then
  run npx prisma migrate deploy
fi
run npx prisma generate
run npm run build
run pm2 restart api

echo "── widget ──"
cd "$REPO_ROOT/widget-svelte"
run npm install
run npm run build

echo "── platform ──"
cd "$REPO_ROOT/platform"
run npm install
run npm run build

echo "── done ──"