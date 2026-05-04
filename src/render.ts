import { basename, join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { copyDir, exists, readManifest, readText, writeText } from './io.js';
import type { HostTarget, SkillManifest } from './types.js';

export async function renderSkill(dir: string, target: HostTarget, out: string): Promise<string[]> {
  const manifest = await readManifest(dir);
  if (!manifest.hosts.includes(target)) throw new Error(`Skill ${manifest.name} does not declare host support for ${target}.`);
  await mkdir(out, { recursive: true });
  return target === 'openclaw' ? renderOpenClaw(dir, out, manifest) : renderClaudePlugin(dir, out, manifest);
}

async function renderOpenClaw(dir: string, out: string, manifest: SkillManifest): Promise<string[]> {
  const skillDir = join(out, manifest.name);
  await mkdir(skillDir, { recursive: true });
  const written: string[] = [];
  for (const file of manifest.files) {
    await copyDir(join(dir, file), join(skillDir, file));
    written.push(join(manifest.name, file));
  }
  await writeText(join(skillDir, 'README.md'), hostReadme(manifest, 'OpenClaw'));
  written.push(join(manifest.name, 'README.md'));
  return written;
}

async function renderClaudePlugin(dir: string, out: string, manifest: SkillManifest): Promise<string[]> {
  const pluginDir = join(out, `${manifest.name}-plugin`);
  const skillsDir = join(pluginDir, 'skills', manifest.name);
  await mkdir(skillsDir, { recursive: true });
  const skillMd = await readText(join(dir, 'SKILL.md'));
  await writeText(join(skillsDir, 'SKILL.md'), skillMd);
  const plugin = { name: `${manifest.name}-plugin`, version: manifest.version, description: manifest.description, skills: [{ name: manifest.name, path: `skills/${manifest.name}/SKILL.md` }] };
  await writeText(join(pluginDir, 'plugin.json'), JSON.stringify(plugin, null, 2) + '\n');
  await writeText(join(pluginDir, 'README.md'), hostReadme(manifest, 'Claude plugin-style'));
  return [join(basename(pluginDir), 'plugin.json'), join(basename(pluginDir), 'README.md'), join(basename(pluginDir), 'skills', manifest.name, 'SKILL.md')];
}

function hostReadme(manifest: SkillManifest, host: string): string {
  return `# ${manifest.title ?? manifest.name}\n\nRendered by skillforge for ${host}.\n\n${manifest.description}\n\n## Activation examples\n\n${manifest.activation.examples.map((e) => `- ${e}`).join('\n')}\n`;
}

export async function ensureRenderable(dir: string): Promise<void> {
  if (!(await exists(join(dir, 'skill.yaml')))) throw new Error('Cannot render without skill.yaml.');
}
