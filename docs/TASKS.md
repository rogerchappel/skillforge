# skillforge Tasks

## MVP complete

- [x] Create npm/TypeScript CLI package metadata.
- [x] Define canonical `skill.yaml` manifest model.
- [x] Implement `init`, `lint`, `test`, `render`, `package`, and `report` commands.
- [x] Add OpenClaw renderer.
- [x] Add Claude plugin-style renderer.
- [x] Add fixture-backed activation testing.
- [x] Add lint rules for missing metadata, vague activation, verification, safety, unsafe commands, and host-specific wording.
- [x] Add example TDD skill.
- [x] Add tests, smoke script, and validation script.
- [x] Add README, SECURITY, CONTRIBUTING, license, and GitHub metadata.

## Next

- [ ] Replace tiny YAML parser with a full YAML dependency if richer manifests are needed.
- [ ] Add Cursor/OpenCode/Gemini render adapters.
- [ ] Add golden-file snapshots for rendered outputs.
- [ ] Add JSON schema export for editor validation.
- [ ] Add CI publishing workflow after npm token setup.
