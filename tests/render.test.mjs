import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { renderSkill } from '../dist/render.js';

test('renders openclaw and claude plugin layouts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'skillforge-render-'));
  const open = await renderSkill('examples/tdd-sentinel', 'openclaw', join(out, 'openclaw'));
  const claude = await renderSkill('examples/tdd-sentinel', 'claude-plugin', join(out, 'claude'));
  assert.ok(open.includes('tdd-sentinel/SKILL.md'));
  assert.ok(claude.some((f) => f.endsWith('plugin.json')));
  assert.match(await readFile(join(out, 'claude', 'tdd-sentinel-plugin', 'plugin.json'), 'utf8'), /tdd-sentinel/);
});
