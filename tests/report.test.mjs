import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildValidationReport, renderValidationReport } from '../dist/report.js';

const cli = 'dist/cli.js';

test('validation report summarizes clean skills', async () => {
  const report = await buildValidationReport('examples/tdd-sentinel');
  assert.equal(report.ok, true);
  assert.equal(report.counts.errors, 0);
  assert.equal(report.matrix.ok, true);
  assert.ok(report.hosts.includes('openclaw'));
  assert.match(renderValidationReport(report), /Status: ok/);
});

test('report command emits json and markdown formats', () => {
  const json = JSON.parse(execFileSync(process.execPath, [cli, 'report', 'examples/tdd-sentinel'], { encoding: 'utf8' }));
  assert.equal(json.ok, true);
  assert.equal(json.counts.errors, 0);

  const markdown = execFileSync(process.execPath, [cli, 'report', 'examples/tdd-sentinel', '--format', 'markdown'], { encoding: 'utf8' });
  assert.match(markdown, /# SkillForge Validation Report/);
  assert.match(markdown, /Matrix: ok/);
});

test('report command fails when validation is blocked', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-report-'));
  await writeFile(join(dir, 'skill.yaml'), 'name: bad\ndescription: too short\nversion: 0.1.0\nhosts:\n  - openclaw\nactivation:\n  examples:\n    - use bad\nfiles:\n  - SKILL.md\nsafety:\n  externalWrites: ask-first\n  notes:\n    - ask first\nverification:\n  - test\n');
  const result = spawnSync(process.execPath, [cli, 'report', dir], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, false);
  assert.equal(report.counts.errors, 1);
});
