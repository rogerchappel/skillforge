# Adapter Notes

## OpenClaw

Renders `<out>/<skill-name>/SKILL.md` plus a host README. This matches local skill folder conventions.

## Claude plugin-style

Renders `<out>/<skill-name>-plugin/plugin.json` and `skills/<skill-name>/SKILL.md`. The shape is intentionally minimal and reviewable.

Future adapters should preserve the canonical source and keep host-specific ceremony isolated in render output.
