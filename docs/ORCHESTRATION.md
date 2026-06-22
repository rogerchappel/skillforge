# Orchestration

skillforge is designed as a local-first factory step in an agent workflow.

## Loop

1. Author a canonical skill directory.
2. Run `skillforge lint` for quality and safety diagnostics.
3. Run `skillforge test` against activation fixtures.
4. Render to one or more host layouts.
5. Package the skill bundle for review or distribution.
6. Run `skillforge report <skill-dir> --format json` for a machine-readable release gate.
7. Commit the skill source, rendered goldens if desired, and fixture changes together.

## Agent handoff contract

Agents should not claim a skill is ready until they have run at least:

```bash
npm run build
node dist/cli.js lint <skill-dir>
node dist/cli.js test <skill-dir> --fixtures <fixture-file>
node dist/cli.js report <skill-dir> --format json
```

Use `skillforge report <skill-dir> --format markdown` for pull request evidence and `--format json` for automation.
