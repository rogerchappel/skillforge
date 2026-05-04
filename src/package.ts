import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { listFiles, readText, copyDir, writeText } from './io.js';
import { readManifest } from './io.js';

export async function packageSkill(dir: string, out: string): Promise<{ out: string; sha256: string; files: string[] }> {
  const manifest = await readManifest(dir);
  const files = await listFiles(dir);
  const tmp = await mkdtemp(join(tmpdir(), 'skillforge-pack-'));
  try {
    const staging = join(tmp, manifest.name);
    await copyDir(dir, staging);
    await writeText(join(staging, 'SKILLFORGE_PACKAGE.json'), JSON.stringify({ name: manifest.name, version: manifest.version, files }, null, 2) + '\n');
    const payload = JSON.stringify(await collect(staging), null, 2) + '\n';
    const target = resolve(out || `${manifest.name}.skill.tgz`);
    const hash = createHash('sha256');
    const gzip = createGzip();
    gzip.on('data', (chunk) => hash.update(chunk));
    await pipeline(Readable.from(payload), gzip, createWriteStream(target));
    return { out: target, sha256: hash.digest('hex'), files };
  } finally { await rm(tmp, { recursive: true, force: true }); }
}

async function collect(dir: string): Promise<Record<string, string>> {
  const entries: Record<string, string> = {};
  for (const file of await listFiles(dir)) entries[join(basename(dir), file)] = await readText(join(dir, file));
  return entries;
}
