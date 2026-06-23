import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
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

test('portable skills warn when anti-examples are missing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-lint-'));
  await writeFile(join(dir, 'skill.yaml'), [
    'name: weak-activation',
    'description: Use this skill when a task needs a repeatable agent workflow with explicit boundaries.',
    'version: 0.1.0',
    'hosts:',
    '  - openclaw',
    'activation:',
    '  examples:',
    '    - Use the workflow for this release review.',
    'files:',
    '  - SKILL.md',
    'safety:',
    '  externalWrites: ask-first',
    '  notes:',
    '    - Ask before external writes.',
    'verification:',
    '  - Run the smoke check.'
  ].join('\n'));
  await writeFile(join(dir, 'SKILL.md'), '# Weak Activation\n\n## When to use\n\nUse for release review.\n\n## Workflow\n\nRun the review.\n\n## Safety\n\nAsk first.\n\n## Verification\n\nRun smoke.\n');
  const diagnostics = await lintSkill(dir);
  assert.ok(diagnostics.some((d) => d.code === 'activation.anti-examples'));
});

test('SKILL.md warns when verification guidance is absent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-lint-'));
  await writeFile(join(dir, 'skill.yaml'), [
    'name: missing-section',
    'description: Use this skill when a task needs a repeatable agent workflow with explicit boundaries.',
    'version: 0.1.0',
    'hosts:',
    '  - openclaw',
    'activation:',
    '  examples:',
    '    - Use the workflow for this release review.',
    '  antiExamples:',
    '    - Explain what a release review is.',
    'files:',
    '  - SKILL.md',
    'safety:',
    '  externalWrites: ask-first',
    '  notes:',
    '    - Ask before external writes.',
    'verification:',
    '  - Run the smoke check.'
  ].join('\n'));
  await writeFile(join(dir, 'SKILL.md'), '# Missing Section\n\n## When to use\n\nUse for release review.\n\n## Workflow\n\nRun the review.\n\n## Safety\n\nAsk first.\n');
  const diagnostics = await lintSkill(dir);
  assert.ok(diagnostics.some((d) => d.code === 'markdown.verification'));
});
