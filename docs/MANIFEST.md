# Manifest Reference

`skill.yaml` is the portable source of truth.

- `name`: kebab-case package-safe skill id.
- `description`: activation-oriented summary of when the skill should be used.
- `activation.examples`: prompts that should trigger the skill.
- `activation.antiExamples`: prompts that should not trigger the skill. Anti-examples veto keyword or example matches when all meaningful anti-example words appear in the prompt.
- `hosts`: render targets supported by the skill source.
- `files`: relative paths to the portable source files required by the skill.
- `safety.externalWrites`: `forbidden`, `ask-first`, or `allowed`.
- `verification`: checks an agent should run before claiming completion.

## Package contents

`skillforge package` includes `skill.yaml`, every path declared in `files`, and
the generated `SKILLFORGE_PACKAGE.json` metadata file. Other files beside the
skill source—such as local notes, build output, and editor settings—are not
included.

Each declared path must be a unique, non-empty relative path inside the skill
directory. Packaging fails with the missing or invalid path when a declaration
cannot be included. `SKILLFORGE_PACKAGE.json` lists the manifest and declared
source paths actually copied into the archive.
