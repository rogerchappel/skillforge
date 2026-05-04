# PRD: skillforge

Status: in-progress
Decision: backlog

## Scorecard

Total: 84/100
Band: build now
Last scored: 2026-05-03
Scored by: Neo

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 18/20 | Teams want coding agents to follow repeatable engineering workflows, but skill/plugin systems are fragmented across Claude, Codex, Cursor, OpenCode, Gemini, and local agent harnesses. |
| Demand signal | 18/20 | Strong adjacent signal from `obra/superpowers`: a cross-agent skills framework and development methodology with explicit Claude/Codex/Cursor/OpenCode/Gemini installation paths. |
| V1 buildability | 16/20 | A focused V1 can generate, validate, package, and test portable skill bundles without needing to own every host's marketplace integration. |
| Differentiation | 12/15 | Differentiate as an open, host-neutral authoring/compatibility toolkit rather than one opinionated methodology bundle. |
| Agentic workflow leverage | 15/15 | Directly improves agent reliability by turning engineering rituals into reusable, testable, reviewable workflows. |
| Distribution potential | 5/10 | Clear developer-agent audience, though category is early and host-specific plugin marketplaces may limit reach. |

## Pitch

A host-neutral toolkit for authoring, validating, testing, and packaging portable coding-agent skills across Claude, Codex, Cursor, OpenCode, Gemini, and OpenClaw-style agents.

## Why It Matters

Agent skill systems are becoming the new shell scripts: every serious team will want repeatable workflows for planning, TDD, debugging, code review, releases, incident response, and project onboarding. Today those skills are easy to write badly and hard to port between agent hosts. `skillforge` would make skills auditable, testable, reusable, and distributable.

## Qualification

### Pub Test

Can this be explained clearly in one sentence? Yes: “Build and test coding-agent skills once, then package them for multiple agent hosts.”

### Competitors / Adjacent Tools

- `obra/superpowers` — strong signal for composable skills plus methodology; supports multiple agent environments and shows demand for workflow-level agent behavior.
- Claude Code plugins / Codex plugins / Cursor plugins / Gemini extensions — host-specific distribution channels with similar intent but different formats and lifecycle assumptions.
- OpenClaw skills — local skill instructions and tooling conventions; useful internal comparison point for skill authoring and validation.
- Prompt libraries — weaker because they usually lack activation rules, file layout conventions, verification, and host-specific packaging.

### Star / Demand Signal

- `obra/superpowers` is explicitly marketed as an agentic skills framework and software development methodology, not just prompts.
- The README advertises installation paths for Claude, Codex, Cursor, OpenCode, Copilot, and Gemini, which validates cross-host demand.
- Roger's own workflows already depend on skills, cron prompts, subagents, PR loops, and repeatable coding/review patterns.

### Real Problem

Agents behave better when workflows are explicit, but teams lack a good way to author a skill once, lint the activation rules, simulate whether it fires, package it for different hosts, and run regression tests against example tasks. Without tooling, skills become unreviewed prompt blobs that drift and silently stop working.

### V1 Buildability

A tight V1 can be a local CLI plus schema:

- define a simple canonical `skill.yaml` + `SKILL.md` format
- validate frontmatter, activation descriptions, tool assumptions, examples, and safety notes
- render adapters for Claude/Codex/Cursor/OpenCode/Gemini/OpenClaw-style layouts
- run dry-run activation tests against sample user prompts
- package a skill bundle as a tarball or repo folder
- produce a compatibility report with warnings per host

## V1 Scope

- CLI: `skillforge init`, `skillforge lint`, `skillforge test`, `skillforge package`, `skillforge render`.
- Canonical skill manifest with name, description, activation examples, host support, required files, and safety notes.
- Markdown lint for common failure modes: vague activation, missing verification, host-specific commands in generic docs, unsafe external-write instructions.
- Fixture-based activation tests: given prompts, assert whether the skill should trigger.
- Render/export adapters for at least OpenClaw-style skills and one plugin-style host layout.
- Example skills: TDD, systematic debugging, PR finishing, release checklist.

## Out of Scope

- Owning a public marketplace in V1.
- Automatically installing into every host.
- Reproducing `superpowers` methodology content.
- Cloud sync, hosted analytics, or team admin.

## CLI/API Sketch

```bash
skillforge init tdd-workflow
skillforge lint ./skills/tdd-workflow
skillforge test ./skills/tdd-workflow --fixtures fixtures/activation.json
skillforge render ./skills/tdd-workflow --target openclaw --out dist/openclaw
skillforge render ./skills/tdd-workflow --target claude-plugin --out dist/claude
skillforge package ./skills/tdd-workflow --out dist/tdd-workflow.tgz
```

## Verification

- Golden-file tests for rendered host outputs.
- Fixture tests for activation matching.
- Lint tests for intentionally broken skills.
- CLI smoke tests with a generated sample skill.
- Documentation examples that run in CI.

## Agent Prompt

Build `skillforge`, a host-neutral CLI for creating, validating, testing, and packaging portable coding-agent skills. Start with a local-first TypeScript CLI, a canonical skill manifest schema, lint rules for skill quality/safety, activation fixture tests, and render adapters for OpenClaw-style skills plus one plugin-style host layout. Do not copy `obra/superpowers`; use it only as evidence that cross-agent skill workflows are a real category.
