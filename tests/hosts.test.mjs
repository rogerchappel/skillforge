import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { lintSkill } from '../dist/lint.js';
import { buildCompatibilityMatrix } from '../dist/matrix.js';
import { buildValidationReport } from '../dist/report.js';

const cli = 'dist/cli.js';
const validHosts = 'hosts:\n  - openclaw\n  - claude-plugin';
const malformedHosts = [
  ['absent', ''],
  ['scalar', 'hosts: openclaw'],
  ['empty', 'hosts:'],
  ['unsupported', 'hosts:\n  - openclawish']
];

async function skillWithHosts(replacement) {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-hosts-'));
  await cp('examples/tdd-sentinel', dir, { recursive: true });
  const path = join(dir, 'skill.yaml');
  const manifest = await readFile(path, 'utf8');
  await writeFile(path, manifest.replace(validHosts, replacement));
  return dir;
}

for (const [shape, replacement] of malformedHosts) {
  test(`${shape} hosts are stable across library and CLI validation paths`, async () => {
    const dir = await skillWithHosts(replacement);
    const diagnostics = await lintSkill(dir);
    const hostErrors = diagnostics.filter((item) => item.code === 'manifest.hosts');
    assert.equal(hostErrors.length, 1);
    assert.match(hostErrors[0].message, /hosts must/);

    const matrix = await buildCompatibilityMatrix(dir);
    assert.equal(matrix.ok, false);
    assert.ok(Array.isArray(matrix.rows));
    assert.ok(matrix.rows.every((row) => row.blockers.some((item) => item.code === 'manifest.hosts')));

    const report = await buildValidationReport(dir);
    assert.equal(report.ok, false);
    assert.deepEqual(report.hosts, []);

    for (const command of ['lint', 'matrix', 'report']) {
      const args = [cli, command, dir];
      if (command !== 'report') args.push('--format', 'json');
      const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
      assert.equal(result.status, 1, `${command}: ${result.stderr}`);
      assert.doesNotMatch(result.stderr, /TypeError|Cannot read properties/);
      const output = JSON.parse(result.stdout);
      const emittedDiagnostics = command === 'matrix'
        ? output.rows.flatMap((row) => row.blockers)
        : output.diagnostics;
      assert.ok(emittedDiagnostics.some((item) => item.code === 'manifest.hosts'));
      if (command === 'matrix') assert.ok(Array.isArray(output.rows));
      if (command === 'report') assert.deepEqual(output.hosts, []);
    }
  });
}
