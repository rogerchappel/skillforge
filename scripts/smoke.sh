#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
node "$ROOT/dist/cli.js" init parser-guard --cwd "$TMP" >/dev/null 2>&1 || (cd "$TMP" && node "$ROOT/dist/cli.js" init parser-guard >/dev/null)
SKILL="$TMP/parser-guard"
node "$ROOT/dist/cli.js" lint "$SKILL"
node "$ROOT/dist/cli.js" test "$SKILL" --fixtures "$SKILL/fixtures/activation.json"
node "$ROOT/dist/cli.js" report "$SKILL" --format json | grep -q '"ok": true'
node "$ROOT/dist/cli.js" report "$SKILL" --format markdown | grep -q "Status: ok"
node "$ROOT/dist/cli.js" render "$SKILL" --target openclaw --out "$TMP/rendered/openclaw"
node "$ROOT/dist/cli.js" render "$SKILL" --target claude-plugin --out "$TMP/rendered/claude"
node "$ROOT/dist/cli.js" package "$SKILL" --out "$TMP/parser-guard.skill.tgz"
test -s "$TMP/parser-guard.skill.tgz"
echo "smoke ok: $TMP"
