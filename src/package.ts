import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { copyPath, exists, readManifest, writeText } from './io.js';

export async function packageSkill(dir: string, out: string): Promise<{ out: string; sha256: string; files: string[] }> {
  const manifest = await readManifest(dir);
  const declaredFiles = validateDeclaredFiles(manifest.files);
  for (const file of declaredFiles) {
    if (!(await exists(join(dir, file)))) {
      throw new Error(`Cannot package skill: declared file is missing: ${file}`);
    }
    if (!(await stat(join(dir, file))).isFile()) {
      throw new Error(`Cannot package skill: declared path is not a file: ${file}`);
    }
  }
  const files = ['skill.yaml', ...declaredFiles];
  const tmp = await mkdtemp(join(tmpdir(), 'skillforge-pack-'));
  try {
    const staging = join(tmp, manifest.name);
    for (const file of files) await copyPath(join(dir, file), join(staging, file));
    await writeText(join(staging, 'SKILLFORGE_PACKAGE.json'), JSON.stringify({ name: manifest.name, version: manifest.version, files }, null, 2) + '\n');
    const target = resolve(out || `${manifest.name}.skill.tgz`);
    await runTar(tmp, manifest.name, target);
    return { out: target, sha256: await sha256File(target), files };
  } finally { await rm(tmp, { recursive: true, force: true }); }
}

function validateDeclaredFiles(files: unknown): string[] {
  if (!Array.isArray(files)) throw new Error('Cannot package skill: manifest files must be an array.');
  const validated = files.map((file) => {
    if (typeof file !== 'string' || !file.trim()) {
      throw new Error('Cannot package skill: each declared file must be a non-empty relative path.');
    }
    const normalized = normalize(file);
    if (isAbsolute(file) || normalized === '..' || normalized.startsWith(`..${sep}`)) {
      throw new Error(`Cannot package skill: declared file must stay within the skill directory: ${file}`);
    }
    if (normalized === 'skill.yaml' || normalized === 'SKILLFORGE_PACKAGE.json') {
      throw new Error(`Cannot package skill: ${file} is managed by skillforge and must not be declared.`);
    }
    return normalized;
  });
  if (new Set(validated).size !== validated.length) {
    throw new Error('Cannot package skill: manifest files must not contain duplicate paths.');
  }
  return validated;
}

async function runTar(cwd: string, folder: string, target: string): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn('tar', ['-czf', target, folder], { cwd, stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`tar exited with ${code}`)));
  });
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  await new Promise<void>((resolvePromise, reject) => {
    createReadStream(path).on('data', (chunk) => hash.update(chunk)).on('error', reject).on('end', resolvePromise);
  });
  return hash.digest('hex');
}
