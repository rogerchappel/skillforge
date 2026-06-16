#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { initSkill } from './init.js';
import { lintSkill, hasErrors } from './lint.js';
import { readManifest } from './io.js';
import { runActivationFixtures } from './activate.js';
import { renderSkill } from './render.js';
import { packageSkill } from './package.js';
import { buildCompatibilityMatrix, renderCompatibilityMatrix } from './matrix.js';
import type { ActivationFixture, HostTarget } from './types.js';

const [, , command, ...args] = process.argv;

try {
  if (!command || ['-h', '--help', 'help'].includes(command)) help();
  else if (command === 'init') await cmdInit(args);
  else if (command === 'lint') await cmdLint(args);
  else if (command === 'test') await cmdTest(args);
  else if (command === 'render') await cmdRender(args);
  else if (command === 'package') await cmdPackage(args);
  else if (command === 'matrix') await cmdMatrix(args);
  else if (command === 'report') await cmdReport(args);
  else throw new Error(`Unknown command: ${command}`);
} catch (error) {
  console.error(`skillforge: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

async function cmdInit(args: string[]) { const name = args[0]; if (!name) throw new Error('Usage: skillforge init <name>'); console.log(`created ${await initSkill(name, resolve(valueOf(args, '--cwd') ?? process.cwd()))}`); }
async function cmdLint(args: string[]) {
  const dir = resolve(args[0] ?? '.');
  const diagnostics = await lintSkill(dir);
  if (!diagnostics.length) console.log('✓ no lint findings');
  for (const d of diagnostics) console.log(`${d.level.toUpperCase()} ${d.code}${d.file ? ` ${d.file}` : ''} - ${d.message}`);
  if (hasErrors(diagnostics)) process.exit(1);
}
async function cmdTest(args: string[]) {
  const dir = resolve(args[0] ?? '.');
  const fixturesPath = valueOf(args, '--fixtures') ?? `${dir}/fixtures/activation.json`;
  const manifest = await readManifest(dir);
  const fixtures = JSON.parse(await readFile(fixturesPath, 'utf8')) as ActivationFixture[];
  const results = runActivationFixtures(manifest, fixtures);
  for (const r of results) console.log(`${r.actual === r.shouldActivate ? '✓' : '✗'} ${r.shouldActivate ? 'activate' : 'skip'} :: ${r.prompt}`);
  const failures = results.filter((r) => r.actual !== r.shouldActivate);
  if (failures.length) throw new Error(`${failures.length} activation fixture(s) failed.`);
}
async function cmdRender(args: string[]) {
  const dir = resolve(args[0] ?? '.');
  const target = valueOf(args, '--target') as HostTarget | undefined;
  const out = valueOf(args, '--out') ?? 'dist/rendered';
  if (!target) throw new Error('Usage: skillforge render <dir> --target <openclaw|claude-plugin> --out <dir>');
  const files = await renderSkill(dir, target, resolve(out));
  console.log(`rendered ${files.length} file(s) to ${resolve(out)}`);
}
async function cmdPackage(args: string[]) {
  const dir = resolve(args[0] ?? '.');
  const out = valueOf(args, '--out') ?? 'dist/skill.tgz';
  const result = await packageSkill(dir, out);
  console.log(`packaged ${result.files.length} file(s) to ${result.out}`);
  console.log(`sha256 ${result.sha256}`);
}
async function cmdMatrix(args: string[]) {
  const dir = resolve(args[0] ?? '.');
  const format = valueOf(args, '--format') ?? 'markdown';
  const matrix = await buildCompatibilityMatrix(dir);
  if (format === 'json') console.log(JSON.stringify(matrix, null, 2));
  else if (format === 'markdown') process.stdout.write(renderCompatibilityMatrix(matrix));
  else throw new Error('Usage: skillforge matrix <dir> [--format markdown|json]');
  if (!matrix.ok) process.exitCode = 1;
}
async function cmdReport(args: string[]) {
  const dir = resolve(args[0] ?? '.');
  const manifest = await readManifest(dir);
  const diagnostics = await lintSkill(dir);
  console.log(JSON.stringify({ manifest: manifest.name, hosts: manifest.hosts, diagnostics }, null, 2));
}
function valueOf(args: string[], flag: string): string | undefined { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; }
function help() { console.log(`skillforge — portable coding-agent skill foundry\n\nCommands:\n  skillforge init <name>\n  skillforge lint <skill-dir>\n  skillforge test <skill-dir> --fixtures fixtures/activation.json\n  skillforge render <skill-dir> --target openclaw --out dist/openclaw\n  skillforge render <skill-dir> --target claude-plugin --out dist/claude\n  skillforge matrix <skill-dir> [--format markdown|json]\n  skillforge package <skill-dir> --out dist/name.skill.tgz\n  skillforge report <skill-dir>\n`); }
