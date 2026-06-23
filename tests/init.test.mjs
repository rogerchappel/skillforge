import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initSkill } from '../dist/init.js';
import { lintSkill } from '../dist/lint.js';

test('init creates a skill that lints cleanly', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-init-'));
  const skillDir = await initSkill('release-guard', dir);
  const skillMarkdown = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
  assert.match(skillMarkdown, /## Verification/);
  const diagnostics = await lintSkill(skillDir);
  assert.deepEqual(diagnostics, []);
});
