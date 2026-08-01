# Adapter Notes

## OpenClaw

Renders `<out>/<skill-name>/SKILL.md` plus a host README. This matches local skill folder conventions.

Each render replaces only `<out>/<skill-name>`, so files left by an earlier render cannot leak into the new output and sibling paths under `<out>` remain untouched. Declared portable files take precedence over generated adapter metadata: when the declared files produce `<skill-name>/README.md`, skillforge preserves that README and does not generate a host README over it.

## Claude plugin-style

Renders `<out>/<skill-name>-plugin/plugin.json` and `skills/<skill-name>/SKILL.md`. The shape is intentionally minimal and reviewable.

Each render replaces only `<out>/<skill-name>-plugin>` before recreating the plugin layout.

Future adapters should preserve the canonical source and keep host-specific ceremony isolated in render output.
