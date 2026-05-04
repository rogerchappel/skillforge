import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { lintSkill } from '../dist/lint.js';

test('fixture skill lints cleanly', async () => {
  const diagnostics = await lintSkill('examples/tdd-sentinel');
  assert.deepEqual(diagnostics.filter((d) => d.level === 'error'), []);
});

test('missing required file is an error', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-lint-'));
  await writeFile(join(dir, 'skill.yaml'), 'name: bad\ndescription: too short\nversion: 0.1.0\nhosts:\n  - openclaw\nactivation:\n  examples:\n    - use bad\nfiles:\n  - SKILL.md\nsafety:\n  externalWrites: ask-first\n  notes:\n    - ask first\nverification:\n  - test\n');
  const diagnostics = await lintSkill(dir);
  assert.ok(diagnostics.some((d) => d.code === 'file.missing'));
});
