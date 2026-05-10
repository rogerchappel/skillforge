#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"
npm run build >/dev/null
npm pack --pack-destination "$TMP_DIR" >/dev/null
PACKAGE_TGZ="$(find "$TMP_DIR" -maxdepth 1 -name 'skillforge-*.tgz' -print -quit)"
test -n "$PACKAGE_TGZ"

mkdir -p "$TMP_DIR/app"
cd "$TMP_DIR/app"
npm init -y >/dev/null
npm install "$PACKAGE_TGZ" >/dev/null
npx skillforge --help >/dev/null
npx skillforge init parser-guard --cwd "$TMP_DIR/app" >/dev/null
npx skillforge lint parser-guard | grep -q 'no lint findings'
npx skillforge test parser-guard --fixtures parser-guard/fixtures/activation.json | grep -q 'activate'
npx skillforge render parser-guard --target openclaw --out rendered/openclaw >/dev/null
npx skillforge package parser-guard --out parser-guard.skill.tgz | grep -q '^sha256 '
test -s parser-guard.skill.tgz
