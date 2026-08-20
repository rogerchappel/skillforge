#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"
npm run build >/dev/null
npm pack --json --pack-destination "$TMP_DIR" > "$TMP_DIR/pack.json"
PACKAGE_FILENAME="$(node -e "const fs=require('node:fs'); const result=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(result[0].filename)" "$TMP_DIR/pack.json")"
PACKAGE_TGZ="$TMP_DIR/$PACKAGE_FILENAME"
test -n "$PACKAGE_TGZ"
test -f "$PACKAGE_TGZ"

PACKAGE_JSON="$(tar -xOf "$PACKAGE_TGZ" package/package.json)"
node -e "const value=JSON.parse(process.argv[1]); const source=require('./package.json'); if(value.name !== source.name || value.version !== source.version || value.bin?.skillforge !== 'dist/cli.js') process.exit(1)" "$PACKAGE_JSON"

mkdir -p "$TMP_DIR/app"
cd "$TMP_DIR/app"
npm init -y >/dev/null
npm install "$PACKAGE_TGZ" >/dev/null
npm ls @rogerchappel/skillforge --depth=0 >/dev/null
npx skillforge --help >/dev/null
npx skillforge init parser-guard --cwd "$TMP_DIR/app" >/dev/null
npx skillforge lint parser-guard | grep -q 'no lint findings'
npx skillforge test parser-guard --fixtures parser-guard/fixtures/activation.json | grep -q 'activate'
npx skillforge render parser-guard --target openclaw --out rendered/openclaw >/dev/null
npx skillforge package parser-guard --out parser-guard.skill.tgz | grep -q '^sha256 '
test -s parser-guard.skill.tgz
tar -tzf parser-guard.skill.tgz | grep -q '^parser-guard/fixtures/activation\.json$'
tar -xOf parser-guard.skill.tgz parser-guard/SKILLFORGE_PACKAGE.json \
  | grep -q '"fixtures/activation.json"'
