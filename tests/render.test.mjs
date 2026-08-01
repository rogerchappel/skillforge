import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { renderSkill } from '../dist/render.js';

test('renders openclaw and claude plugin layouts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'skillforge-render-'));
  const open = await renderSkill('examples/tdd-sentinel', 'openclaw', join(out, 'openclaw'));
  const claude = await renderSkill('examples/tdd-sentinel', 'claude-plugin', join(out, 'claude'));
  assert.ok(open.includes('tdd-sentinel/SKILL.md'));
  assert.ok(claude.some((f) => f.endsWith('plugin.json')));
  assert.match(await readFile(join(out, 'claude', 'tdd-sentinel-plugin', 'plugin.json'), 'utf8'), /tdd-sentinel/);
});

test('preserves a portable README instead of replacing it with host metadata', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillforge-render-readme-'));
  const skill = join(root, 'skill');
  const out = join(root, 'out');
  await cp('examples/tdd-sentinel', skill, { recursive: true });
  await writeFile(join(skill, 'README.md'), '# Portable instructions\n');
  await writeFile(join(skill, 'skill.yaml'), (await readFile(join(skill, 'skill.yaml'), 'utf8')).replace('  - SKILL.md\n', '  - SKILL.md\n  - README.md\n'));

  const written = await renderSkill(skill, 'openclaw', out);

  assert.equal(await readFile(join(out, 'tdd-sentinel', 'README.md'), 'utf8'), '# Portable instructions\n');
  assert.equal(written.filter((file) => file === 'tdd-sentinel/README.md').length, 1);
});

test('rerender replaces only the selected target directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillforge-rerender-'));
  const out = join(root, 'out');
  await renderSkill('examples/tdd-sentinel', 'openclaw', out);
  await writeFile(join(out, 'tdd-sentinel', 'stale.txt'), 'obsolete\n');
  await mkdir(join(out, 'unrelated'), { recursive: true });
  await writeFile(join(out, 'unrelated', 'keep.txt'), 'keep\n');

  await renderSkill('examples/tdd-sentinel', 'openclaw', out);

  await assert.rejects(readFile(join(out, 'tdd-sentinel', 'stale.txt'), 'utf8'), { code: 'ENOENT' });
  assert.equal(await readFile(join(out, 'unrelated', 'keep.txt'), 'utf8'), 'keep\n');
});
