# Release Candidate Notes

## Candidate

- Package: `@rogerchappel/skillforge@0.2.0`
- Expected tag: `v0.2.0`
- Classification: ship

## Included

- Local-first CLI for `init`, `lint`, `test`, `render`, `package`, and `report`.
- Canonical `skill.yaml` plus `SKILL.md` authoring workflow.
- Activation fixture checks for prompt-trigger behavior.
- Render adapters for OpenClaw-style skills and Claude plugin-style bundles.
- Deterministic package archive generation with SHA-256 output.

## Verification

```sh
npm install
npm run release:check
```

Expected result: TypeScript check, test suite, smoke script, release metadata,
packed artifact installation, and package commands all pass without publishing.

## Limits

- No marketplace publishing.
- No host auto-installation.
- No network access in default commands.
- Render adapters are intentionally small and should be extended with fixture-backed tests.

## Release Gate

Before tagging or publishing, review the package contents from `npm run package:smoke` and confirm that generated host layouts match the current host documentation.
Follow [`docs/RELEASE.md`](RELEASE.md) for the exact tag-triggered procedure.
