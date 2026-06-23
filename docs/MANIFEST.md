# Manifest Reference

`skill.yaml` is the portable source of truth.

- `name`: kebab-case package-safe skill id.
- `description`: activation-oriented summary of when the skill should be used.
- `activation.examples`: prompts that should trigger the skill.
- `activation.antiExamples`: prompts that should not trigger the skill. Anti-examples veto keyword or example matches when all meaningful anti-example words appear in the prompt.
- `hosts`: render targets supported by the skill source.
- `files`: source files required by the skill.
- `safety.externalWrites`: `forbidden`, `ask-first`, or `allowed`.
- `verification`: checks an agent should run before claiming completion.

## Lint expectations

Portable skills should include both positive activation examples and anti-examples. Missing anti-examples are reported as warnings because older skill bundles can still render, but release reviewers should treat the warning as a quality gap before publishing.

When `files` includes `SKILL.md`, the linter also checks for sections that cover activation, workflow, safety or approvals, and verification. These section warnings are meant to keep generated skills usable by agents without requiring each host adapter to infer side-effect boundaries from prose.
