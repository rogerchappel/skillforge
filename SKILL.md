---
name: skillforge
description: Author, lint, test, render, and package portable coding-agent skills.
version: 0.1.0
targets: [codex, claude, openclaw, agents]
tags: [skills, packaging, validation, agent-workflows]
---

# skillforge

Use this skill when an agent needs to turn repeatable engineering instructions into a portable, reviewable skill bundle.

## Inputs

- A local skill directory containing `skill.yaml`, `SKILL.md`, and optional `fixtures/activation.json`.
- A target host layout, currently `openclaw` or `claude-plugin`, when rendering host-specific output.
- A local output path for rendered files or packaged `.skill.tgz` artifacts.

## Tools

- `skillforge lint <skill-dir>` checks manifest, documentation, activation, and safety quality.
- `skillforge test <skill-dir> --fixtures <path>` runs activation examples against the manifest.
- `skillforge render <skill-dir> --target <target> --out <dir>` writes host-specific files.
- `skillforge package <skill-dir> --out <file>` creates a deterministic archive with a SHA-256 digest.
- `skillforge report <skill-dir> --format json|markdown` combines lint and compatibility results for release gates.

## Side Effects

`lint`, `test`, and `report` are read-only. `init`, `render`, and `package` write only to the explicit local destination. No command publishes packages, installs skills into a live agent host, or calls network services.

## Approval Boundaries

Ask for explicit approval before overwriting an existing skill directory, copying rendered output into a live agent configuration, or publishing a generated package anywhere outside the local workspace.

## Validation

Run:

```sh
npm run release:check
```

For a single candidate skill, run:

```sh
skillforge lint ./my-skill
skillforge test ./my-skill --fixtures ./my-skill/fixtures/activation.json
skillforge report ./my-skill --format json
```

## Example

```sh
skillforge init pr-review
skillforge lint ./pr-review
skillforge report ./pr-review --format markdown
skillforge render ./pr-review --target openclaw --out ./dist/openclaw
skillforge package ./pr-review --out ./dist/pr-review.skill.tgz
```
