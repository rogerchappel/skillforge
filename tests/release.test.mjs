import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

async function releaseRepo() {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-release-'));
  await mkdir(join(dir, 'scripts'));
  await cp('scripts/verify-release.mjs', join(dir, 'scripts/verify-release.mjs'), { recursive: true });
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: '@rogerchappel/skillforge', version: '0.2.0' }));
  await writeFile(join(dir, 'CHANGELOG.md'), '# Changelog\n\n## 0.2.0\n');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: dir });
  return dir;
}

function verify(dir, args = []) {
  return spawnSync(process.execPath, ['scripts/verify-release.mjs', ...args], { cwd: dir, encoding: 'utf8' });
}

test('strict release verification rejects a missing expected tag', async () => {
  const result = verify(await releaseRepo());
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /expected release tag v0\.2\.0 is missing/);
});

test('dry-run release verification rejects a mismatched supplied tag', async () => {
  const result = verify(await releaseRepo(), ['--dry-run', 'v0.1.0']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /tag v0\.1\.0 does not match package version; expected v0\.2\.0/);
});

test('strict release verification accepts a matching tag at HEAD', async () => {
  const dir = await releaseRepo();
  execFileSync('git', ['tag', 'v0.2.0'], { cwd: dir });
  const result = verify(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /release metadata verified/);
});

test('dry-run release verification accepts the explicit expected tag', async () => {
  const result = verify(await releaseRepo(), ['--dry-run', 'v0.2.0']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /release metadata verified \(dry run\)/);
});
