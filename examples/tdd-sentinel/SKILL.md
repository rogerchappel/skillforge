# TDD Sentinel

## When to use

Use this when a task benefits from a test-first loop: parsers, bug fixes, behavior changes, and regressions that should stay fixed.

## Workflow

1. Name the behavior that should change.
2. Add or update the smallest failing test or fixture.
3. Run that focused test and confirm it fails for the expected reason.
4. Implement the smallest change that makes it pass.
5. Run the focused test, then the relevant broader check.
6. Summarize the behavior, verification, and any tradeoff.

## Safety

- Ask before external writes such as publishing, deployment, or messages.
- Do not hide failing tests; report them as blockers with the smallest reproduction.
