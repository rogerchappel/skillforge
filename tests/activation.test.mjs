import test from 'node:test';
import assert from 'node:assert/strict';
import { readManifest } from '../dist/io.js';
import { runActivationFixtures } from '../dist/activate.js';

test('activation fixtures match expected outcomes', async () => {
  const manifest = await readManifest('examples/tdd-sentinel');
  const fixtures = JSON.parse(await import('node:fs/promises').then((fs) => fs.readFile('examples/tdd-sentinel/fixtures/activation.json', 'utf8')));
  const results = runActivationFixtures(manifest, fixtures);
  assert.equal(results.filter((r) => r.actual !== r.shouldActivate).length, 0);
});
