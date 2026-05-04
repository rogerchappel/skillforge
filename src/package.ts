import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { listFiles, copyDir, writeText } from './io.js';
import { readManifest } from './io.js';

export async function packageSkill(dir: string, out: string): Promise<{ out: string; sha256: string; files: string[] }> {
  const manifest = await readManifest(dir);
  const files = await listFiles(dir);
  const tmp = await mkdtemp(join(tmpdir(), 'skillforge-pack-'));
  try {
    const staging = join(tmp, manifest.name);
    await copyDir(dir, staging);
    await writeText(join(staging, 'SKILLFORGE_PACKAGE.json'), JSON.stringify({ name: manifest.name, version: manifest.version, files }, null, 2) + '\n');
    const target = resolve(out || `${manifest.name}.skill.tgz`);
    await runTar(tmp, manifest.name, target);
    return { out: target, sha256: await sha256File(target), files };
  } finally { await rm(tmp, { recursive: true, force: true }); }
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
