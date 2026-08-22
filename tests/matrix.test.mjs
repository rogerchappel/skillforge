import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildCompatibilityMatrix, renderCompatibilityMatrix } from '../dist/matrix.js';

const execFileAsync = promisify(execFile);

async function singleHostSkill(host) {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-matrix-'));
  await cp('examples/tdd-sentinel', dir, { recursive: true });
  const manifestPath = join(dir, 'skill.yaml');
  const manifest = await readFile(manifestPath, 'utf8');
  await writeFile(manifestPath, manifest.replace('  - openclaw\n  - claude-plugin', `  - ${host}`));
  return dir;
}

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

for (const host of ['openclaw', 'claude-plugin']) {
  test(`undeclared targets do not block a ${host}-only matrix`, async () => {
    const dir = await singleHostSkill(host);
    const matrix = await buildCompatibilityMatrix(dir);

    assert.equal(matrix.ok, true);
    assert.deepEqual(matrix.rows.find((row) => row.target === host), {
      target: host,
      declared: true,
      renderable: true,
      blockers: [],
      warnings: []
    });
    const undeclared = matrix.rows.find((row) => row.target !== host);
    assert.equal(undeclared.declared, false);
    assert.equal(undeclared.renderable, false);
    assert.deepEqual(undeclared.blockers, []);

    const { stdout } = await execFileAsync(process.execPath, ['dist/cli.js', 'matrix', dir, '--format', 'json']);
    assert.equal(JSON.parse(stdout).ok, true);
  });
}
