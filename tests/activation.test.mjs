import test from 'node:test';
import assert from 'node:assert/strict';
import { readManifest } from '../dist/io.js';
import { activationScore, runActivationFixtures } from '../dist/activate.js';

test('activation fixtures match expected outcomes', async () => {
  const manifest = await readManifest('examples/tdd-sentinel');
  const fixtures = JSON.parse(await import('node:fs/promises').then((fs) => fs.readFile('examples/tdd-sentinel/fixtures/activation.json', 'utf8')));
  const results = runActivationFixtures(manifest, fixtures);
  assert.equal(results.filter((r) => r.actual !== r.shouldActivate).length, 0);
});

test('anti-examples block otherwise matching prompts', async () => {
  const manifest = await readManifest('examples/tdd-sentinel');
  const result = activationScore(manifest, 'Explain what TDD means at a high level.');
  assert.equal(result.actual, false);
  assert.equal(result.blockedBy.length, 1);
  assert.match(result.blockedBy[0], /^antiExample:Explain what TDD means/);
  assert.ok(result.matched.includes('tdd'));
});
