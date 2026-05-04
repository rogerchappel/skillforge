import { mkdir, readFile, writeFile, stat, cp, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseYaml, stringifyYaml } from './yaml.js';
import type { SkillManifest } from './types.js';

export async function exists(path: string): Promise<boolean> {
  try { await stat(path); return true; } catch { return false; }
}

export async function readText(path: string): Promise<string> { return readFile(path, 'utf8'); }
export async function writeText(path: string, content: string): Promise<void> { await mkdir(dirname(path), { recursive: true }); await writeFile(path, content); }
export async function copyDir(src: string, dest: string): Promise<void> { await mkdir(dest, { recursive: true }); await cp(src, dest, { recursive: true, force: true }); }
export async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(base: string, rel = '') {
    for (const entry of await readdir(base, { withFileTypes: true })) {
      const childRel = rel ? join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) await walk(join(base, entry.name), childRel); else out.push(childRel);
    }
  }
  await walk(dir);
  return out.sort();
}
export async function readManifest(dir: string): Promise<SkillManifest> { return parseYaml(await readText(join(dir, 'skill.yaml'))) as SkillManifest; }
export async function writeManifest(dir: string, manifest: SkillManifest): Promise<void> { await writeText(join(dir, 'skill.yaml'), stringifyYaml(manifest) + '\n'); }
