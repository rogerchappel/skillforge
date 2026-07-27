import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { packageSkill } from '../dist/package.js';
import { initSkill } from '../dist/init.js';

const execFileAsync = promisify(execFile);

async function createSkill(files = ['SKILL.md', 'fixtures/activation.json']) {
  const dir = await mkdtemp(join(tmpdir(), 'skillforge-package-test-'));
  await mkdir(join(dir, 'fixtures'), { recursive: true });
  await writeFile(join(dir, 'skill.yaml'), `name: package-test
description: Package only the portable source files declared by this manifest.
version: 1.0.0
activation:
  examples:
    - Package this skill.
hosts:
  - openclaw
files:
${files.map((file) => `  - ${file}`).join('\n')}
safety:
  externalWrites: forbidden
  notes:
    - Keep packaging local.
verification:
  - Inspect the archive.
`);
  await writeFile(join(dir, 'SKILL.md'), '# Package test\n');
  await writeFile(join(dir, 'fixtures', 'activation.json'), '[]\n');
  await writeFile(join(dir, 'local-notes.txt'), 'must not be archived\n');
  return dir;
}

test('packages the manifest and declared nested files while excluding undeclared artifacts', async () => {
  const dir = await createSkill();
  const out = join(dir, 'package-test.skill.tgz');
  const result = await packageSkill(dir, out);
  const { stdout } = await execFileAsync('tar', ['-tzf', out]);

  assert.deepEqual(result.files, ['skill.yaml', 'SKILL.md', 'fixtures/activation.json']);
  assert.match(stdout, /package-test\/skill\.yaml/);
  assert.match(stdout, /package-test\/SKILL\.md/);
  assert.match(stdout, /package-test\/fixtures\/activation\.json/);
  assert.doesNotMatch(stdout, /local-notes\.txt/);

  const extract = await mkdtemp(join(tmpdir(), 'skillforge-package-extract-'));
  await execFileAsync('tar', ['-xzf', out, '-C', extract]);
  const metadata = JSON.parse(await readFile(join(extract, 'package-test', 'SKILLFORGE_PACKAGE.json'), 'utf8'));
  assert.deepEqual(metadata.files, result.files);
});

test('packages the activation fixture created by init and records it in package metadata', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'skillforge-init-package-test-'));
  const dir = await initSkill('generated-skill', cwd);
  const out = join(cwd, 'generated-skill.skill.tgz');
  const result = await packageSkill(dir, out);
  const { stdout } = await execFileAsync('tar', ['-tzf', out]);

  assert.deepEqual(result.files, ['skill.yaml', 'SKILL.md', 'fixtures/activation.json']);
  assert.match(stdout, /generated-skill\/fixtures\/activation\.json/);

  const extract = await mkdtemp(join(tmpdir(), 'skillforge-init-package-extract-'));
  await execFileAsync('tar', ['-xzf', out, '-C', extract]);
  const metadata = JSON.parse(await readFile(join(extract, 'generated-skill', 'SKILLFORGE_PACKAGE.json'), 'utf8'));
  assert.deepEqual(metadata.files, result.files);
});

test('rejects a missing declared file with an actionable error', async () => {
  const dir = await createSkill(['SKILL.md', 'fixtures/missing.json']);
  await assert.rejects(
    packageSkill(dir, join(dir, 'package-test.skill.tgz')),
    /declared file is missing: fixtures\/missing\.json/,
  );
});

test('rejects declared paths outside the skill directory', async () => {
  const dir = await createSkill(['SKILL.md', '../outside.txt']);
  await assert.rejects(
    packageSkill(dir, join(dir, 'package-test.skill.tgz')),
    /must stay within the skill directory/,
  );
});
