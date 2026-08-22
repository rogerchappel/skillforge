# skillforge

**Forge agent skills that travel.** skillforge is a local-first CLI for turning repeatable engineering rituals into portable, linted, tested skill bundles for coding agents.

It uses one canonical `skill.yaml`, one `SKILL.md`, fixture-backed activation tests, and rendered layouts for host-specific agents.

## Install

The npm package is not published yet. After the maintainer publishes the `v0.2.0`
release, install it with:

```bash
npm install -g @rogerchappel/skillforge
```

Until then, use a checkout:

```bash
npm ci
npm run build
node dist/cli.js --help
```

## Quick start

```bash
skillforge init tdd-workflow
skillforge lint ./tdd-workflow
skillforge lint ./tdd-workflow --format json
skillforge test ./tdd-workflow --fixtures ./tdd-workflow/fixtures/activation.json
skillforge render ./tdd-workflow --target openclaw --out dist/openclaw
skillforge render ./tdd-workflow --target claude-plugin --out dist/claude
skillforge matrix ./tdd-workflow --format markdown
skillforge report ./tdd-workflow --format json
skillforge package ./tdd-workflow --out dist/tdd-workflow.skill.tgz
```

The package contains `skill.yaml` plus every portable source path listed in its
`files` field. Skills created by `skillforge init` include both `SKILL.md` and
`fixtures/activation.json`, so their activation checks travel with the archive.

## What it checks

- Manifest shape: name, description, version, host support, files, safety, verification.
- Activation clarity: examples, keywords, and fixture outcomes.
- Safety smell tests: risky commands and unqualified external writes.
- Portability warnings: host-specific language inside generic skill docs.
- Compatibility matrix: declared host targets, renderability, blockers, and warnings. Undeclared targets remain visible for portability planning but do not block the matrix or report release gate; every declared host must be renderable.

## Example: TDD Sentinel

```bash
npm run build
node dist/cli.js lint examples/tdd-sentinel
node dist/cli.js test examples/tdd-sentinel --fixtures examples/tdd-sentinel/fixtures/activation.json
node dist/cli.js matrix examples/tdd-sentinel --format json
node dist/cli.js report examples/tdd-sentinel --format markdown
node dist/cli.js render examples/tdd-sentinel --target openclaw --out /tmp/skillforge-openclaw
```

`skillforge report` combines lint diagnostics and the compatibility matrix into one release-gate summary. A lint-clean skill may declare one or both supported hosts; the gate passes when every declared host is renderable. JSON is the default for CI and agent runners; Markdown is for pull request notes.

`skillforge lint --format json` emits only lint diagnostics and is useful when another agent or CI job wants a smaller quality gate before rendering or packaging.

Each command accepts at most one skill directory or name and only the options shown
in `skillforge --help`. Unknown, duplicate, conflicting, or incomplete options fail
with a nonzero exit code, concise usage on stderr, and no result output on stdout.

## Canonical layout

```text
my-skill/
  skill.yaml
  SKILL.md
  fixtures/activation.json
```

`skill.yaml` is intentionally small so teams can review skills like code instead of treating them as mysterious prompt blobs.

## Status

MVP: useful today for local authoring, validation, rendering, package artifacts, and CI smoke tests. The npm distribution target is `@rogerchappel/skillforge`; marketplace publishing and host auto-installation are intentionally out of scope.

## Local Verification

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

`release:check` is non-publishing: it verifies the package name, version,
changelog entry, expected `v<version>` tag, packed tarball metadata, and an
installation of that tarball. Maintainers should follow
[the release procedure](docs/RELEASE.md) to publish; pull requests never publish.
