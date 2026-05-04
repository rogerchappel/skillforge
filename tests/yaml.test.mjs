import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYaml, stringifyYaml } from '../dist/yaml.js';

test('parses nested manifest yaml', () => {
  const value = parseYaml('name: demo\nactivation:\n  keywords:\n    - tdd\nhosts:\n  - openclaw\n');
  assert.equal(value.name, 'demo');
  assert.deepEqual(value.activation.keywords, ['tdd']);
  assert.deepEqual(value.hosts, ['openclaw']);
});

test('stringifies arrays and nested objects', () => {
  assert.match(stringifyYaml({ name: 'demo', hosts: ['openclaw'] }), /hosts:\n  - openclaw/);
});
