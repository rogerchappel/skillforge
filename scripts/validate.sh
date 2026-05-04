#!/usr/bin/env bash
set -euo pipefail
npm run check
npm test
npm run build
npm run smoke
node dist/cli.js lint examples/tdd-sentinel
node dist/cli.js test examples/tdd-sentinel --fixtures examples/tdd-sentinel/fixtures/activation.json
