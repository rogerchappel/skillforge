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

test('round trips escaped quoted scalars in nested arrays', () => {
  const manifest = {
    metadata: {
      examples: [
        'label: "quoted"',
        'windows: C:\\skills\\demo',
        'both: "C:\\skills\\demo"',
      ],
    },
  };

  assert.deepEqual(parseYaml(stringifyYaml(manifest)), manifest);
});

test('round trips strings that resemble other YAML scalar types', () => {
  const manifest = {
    metadata: {
      examples: ['true', 'false', '123', '-4.5', '[alpha]', '- leading dash'],
    },
  };

  assert.deepEqual(parseYaml(stringifyYaml(manifest)), manifest);
});

test('decodes doubled apostrophes in single-quoted scalars', () => {
  assert.deepEqual(parseYaml("name: 'Roger''s skill'\n"), { name: "Roger's skill" });
});
