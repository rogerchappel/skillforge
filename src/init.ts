import { join } from 'node:path';
import { exists, writeManifest, writeText } from './io.js';
import type { SkillManifest } from './types.js';

export async function initSkill(name: string, cwd = process.cwd()): Promise<string> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error('Skill name must be kebab-case.');
  const dir = join(cwd, name);
  if (await exists(dir)) throw new Error(`Refusing to overwrite existing directory: ${dir}`);
  const manifest: SkillManifest = {
    name,
    title: titleCase(name),
    description: `Use ${titleCase(name)} when a user asks for a repeatable engineering workflow with clear verification.`,
    version: '0.1.0',
    activation: {
      keywords: name.split('-'),
      examples: [`Use ${name} to guide this change safely.`, `Run the ${name} checklist before we merge.`],
      antiExamples: ['Casual conversation with no workflow request.']
    },
    hosts: ['openclaw', 'claude-plugin'],
    files: ['SKILL.md'],
    safety: { externalWrites: 'ask-first', notes: ['Ask before external side effects such as publishing, email, or production changes.'] },
    verification: ['Run the smallest meaningful check before claiming success.']
  };
  await writeManifest(dir, manifest);
  await writeText(join(dir, 'SKILL.md'), `# ${titleCase(name)}\n\n## When to use\n\n${manifest.description}\n\n## Workflow\n\n1. Clarify the desired outcome only when blocked.\n2. Inspect the current state before changing it.\n3. Make the smallest useful change.\n4. Verify with tests, lint, build, or direct inspection.\n5. Report what changed and any remaining risk.\n\n## Safety\n\n${manifest.safety.notes.map((n) => `- ${n}`).join('\n')}\n\n## Verification\n\n${manifest.verification.map((step) => `- ${step}`).join('\n')}\n`);
  await writeText(join(dir, 'fixtures', 'activation.json'), JSON.stringify([
    { prompt: `Please use ${name} on this repo`, shouldActivate: true },
    { prompt: 'What is the weather?', shouldActivate: false }
  ], null, 2) + '\n');
  return dir;
}

function titleCase(value: string): string { return value.split('-').map((p) => p[0]!.toUpperCase() + p.slice(1)).join(' '); }
