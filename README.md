# skillforge

**Forge agent skills that travel.** skillforge is a local-first CLI for turning repeatable engineering rituals into portable, linted, tested skill bundles for coding agents.

It is the little blacksmith in your toolchain: one canonical `skill.yaml`, one `SKILL.md`, fixture-backed activation tests, and rendered layouts for host-specific agents.

## Install

```bash
npm install -g skillforge
```

Or run from a checkout:

```bash
npm install
npm run build
node dist/cli.js --help
```

## Quick start

```bash
skillforge init tdd-workflow
skillforge lint ./tdd-workflow
skillforge test ./tdd-workflow --fixtures ./tdd-workflow/fixtures/activation.json
skillforge render ./tdd-workflow --target openclaw --out dist/openclaw
skillforge render ./tdd-workflow --target claude-plugin --out dist/claude
skillforge matrix ./tdd-workflow --format markdown
skillforge package ./tdd-workflow --out dist/tdd-workflow.skill.tgz
```

## What it checks

- Manifest shape: name, description, version, host support, files, safety, verification.
- Activation clarity: examples, keywords, and fixture outcomes.
- Safety smell tests: risky commands and unqualified external writes.
- Portability warnings: host-specific language inside generic skill docs.
- Compatibility matrix: declared host targets, renderability, blockers, and warnings.

## Example: TDD Sentinel

```bash
npm run build
node dist/cli.js lint examples/tdd-sentinel
node dist/cli.js test examples/tdd-sentinel --fixtures examples/tdd-sentinel/fixtures/activation.json
node dist/cli.js matrix examples/tdd-sentinel --format json
node dist/cli.js render examples/tdd-sentinel --target openclaw --out /tmp/skillforge-openclaw
```

## Canonical layout

```text
my-skill/
  skill.yaml
  SKILL.md
  fixtures/activation.json
```

`skill.yaml` is intentionally small so teams can review skills like code instead of treating them as mysterious prompt blobs.

## Status

MVP: useful today for local authoring, validation, rendering, package artifacts, and CI smoke tests. Marketplace publishing and host auto-installation are intentionally out of scope.
