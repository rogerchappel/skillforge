# skillforge Skill

## When To Use

Use this skill when an agent needs to create, lint, test, render, package, or review a portable coding-agent skill bundle. It is especially useful for release gates around `skill.yaml`, `SKILL.md`, activation fixtures, host rendering, and safety notes.

## Inputs

- A local skill directory with `skill.yaml` and `SKILL.md`.
- Optional activation fixture file.
- Optional host target such as `openclaw` or `claude-plugin`.
- Optional output directory or package archive path.

## Side-Effect Boundaries

The lint, test, matrix, and report commands read local files only. Render and package commands write only to the requested output path. The CLI does not publish packages, install skills into an agent host, call network APIs, or approve skill proposals.

## Workflow

1. Run `skillforge lint <skill-dir> --format json` for a small machine-readable quality gate.
2. Run `skillforge test <skill-dir> --fixtures <skill-dir>/fixtures/activation.json` to check activation examples and anti-examples.
3. Run `skillforge matrix <skill-dir> --format markdown` to inspect host compatibility.
4. Run `skillforge report <skill-dir> --format json` before release-candidate review.
5. Render or package only after diagnostics are clean or intentionally accepted.

## Approval Requirements

Ask before writing rendered host layouts into a user-controlled skill directory. Ask before packaging a bundle intended for external sharing. Do not publish, install, or approve skills unless the user explicitly asks for that separate action.

## Examples

```sh
skillforge lint examples/tdd-sentinel --format json
skillforge test examples/tdd-sentinel --fixtures examples/tdd-sentinel/fixtures/activation.json
skillforge report examples/tdd-sentinel --format markdown
skillforge render examples/tdd-sentinel --target openclaw --out /tmp/tdd-sentinel-openclaw
```

## Verification

Run:

```sh
npm run check
npm test
npm run smoke
```
