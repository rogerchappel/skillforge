import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildCompatibilityMatrix, renderCompatibilityMatrix } from '../dist/matrix.js';

const execFileAsync = promisify(execFile);

test('builds a compatibility matrix for declared hosts', async () => {
  const matrix = await buildCompatibilityMatrix('examples/tdd-sentinel');

  assert.equal(matrix.skill, 'tdd-sentinel');
  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.rows.map((row) => row.target), ['openclaw', 'claude-plugin']);
  assert.ok(matrix.rows.every((row) => row.declared && row.renderable));
});

test('renders a markdown compatibility matrix', async () => {
  const matrix = await buildCompatibilityMatrix('examples/tdd-sentinel');
  const markdown = renderCompatibilityMatrix(matrix);

  assert.match(markdown, /Compatibility Matrix: tdd-sentinel/);
  assert.match(markdown, /\| openclaw \| yes \| yes \|/);
});

test('CLI emits JSON compatibility matrix', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['dist/cli.js', 'matrix', 'examples/tdd-sentinel', '--format', 'json']);
  const matrix = JSON.parse(stdout);

  assert.equal(matrix.skill, 'tdd-sentinel');
  assert.equal(matrix.ok, true);
});
