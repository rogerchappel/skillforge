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
import { buildValidationReport, renderValidationReport } from './report.js';
import type { ActivationFixture, HostTarget } from './types.js';

type OptionSpec = { values?: readonly string[] };
type ParsedArgs = { positional?: string; options: Map<string, string | true> };

const usage = {
  init: 'skillforge init <name> [--cwd <dir>]',
  lint: 'skillforge lint [<skill-dir>] [--format text|json | --json]',
  test: 'skillforge test [<skill-dir>] [--fixtures <file>]',
  render: 'skillforge render [<skill-dir>] --target <openclaw|claude-plugin> [--out <dir>]',
  package: 'skillforge package [<skill-dir>] [--out <file>]',
  matrix: 'skillforge matrix [<skill-dir>] [--format markdown|json]',
  report: 'skillforge report [<skill-dir>] [--format json|markdown]',
} as const;

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

async function cmdInit(args: string[]) {
  const parsed = parseArgs('init', args, { '--cwd': {} }, true);
  console.log(`created ${await initSkill(parsed.positional!, resolve(option(parsed, '--cwd') ?? process.cwd()))}`);
}
async function cmdLint(args: string[]) {
  const parsed = parseArgs('lint', args, { '--format': { values: ['text', 'json'] }, '--json': {} });
  if (parsed.options.has('--format') && parsed.options.has('--json')) usageError('lint', '--format and --json cannot be used together');
  const dir = resolve(parsed.positional ?? '.');
  const diagnostics = await lintSkill(dir);
  const format = option(parsed, '--format') ?? (parsed.options.has('--json') ? 'json' : 'text');
  if (format === 'json') {
    console.log(JSON.stringify({ directory: dir, diagnostics, hasErrors: hasErrors(diagnostics) }, null, 2));
  } else if (format === 'text') {
    if (!diagnostics.length) console.log('✓ no lint findings');
    for (const d of diagnostics) console.log(`${d.level.toUpperCase()} ${d.code}${d.file ? ` ${d.file}` : ''} - ${d.message}`);
  }
  if (hasErrors(diagnostics)) process.exit(1);
}
async function cmdTest(args: string[]) {
  const parsed = parseArgs('test', args, { '--fixtures': {} });
  const dir = resolve(parsed.positional ?? '.');
  const fixturesPath = option(parsed, '--fixtures') ?? `${dir}/fixtures/activation.json`;
  const manifest = await readManifest(dir);
  const fixtures = JSON.parse(await readFile(fixturesPath, 'utf8')) as ActivationFixture[];
  const results = runActivationFixtures(manifest, fixtures);
  for (const r of results) {
    const blocked = r.blockedBy.length ? ` blocked=${r.blockedBy.join(',')}` : '';
    console.log(`${r.actual === r.shouldActivate ? '✓' : '✗'} ${r.shouldActivate ? 'activate' : 'skip'} :: ${r.prompt}${blocked}`);
  }
  const failures = results.filter((r) => r.actual !== r.shouldActivate);
  if (failures.length) throw new Error(`${failures.length} activation fixture(s) failed.`);
}
async function cmdRender(args: string[]) {
  const parsed = parseArgs('render', args, { '--target': { values: ['openclaw', 'claude-plugin'] }, '--out': {} });
  const dir = resolve(parsed.positional ?? '.');
  const target = option(parsed, '--target') as HostTarget | undefined;
  const out = option(parsed, '--out') ?? 'dist/rendered';
  if (!target) usageError('render', '--target is required');
  const files = await renderSkill(dir, target, resolve(out));
  console.log(`rendered ${files.length} file(s) to ${resolve(out)}`);
}
async function cmdPackage(args: string[]) {
  const parsed = parseArgs('package', args, { '--out': {} });
  const dir = resolve(parsed.positional ?? '.');
  const out = option(parsed, '--out') ?? 'dist/skill.tgz';
  const result = await packageSkill(dir, out);
  console.log(`packaged ${result.files.length} file(s) to ${result.out}`);
  console.log(`sha256 ${result.sha256}`);
}
async function cmdMatrix(args: string[]) {
  const parsed = parseArgs('matrix', args, { '--format': { values: ['markdown', 'json'] } });
  const dir = resolve(parsed.positional ?? '.');
  const format = option(parsed, '--format') ?? 'markdown';
  const matrix = await buildCompatibilityMatrix(dir);
  if (format === 'json') console.log(JSON.stringify(matrix, null, 2));
  else if (format === 'markdown') process.stdout.write(renderCompatibilityMatrix(matrix));
  if (!matrix.ok) process.exitCode = 1;
}
async function cmdReport(args: string[]) {
  const parsed = parseArgs('report', args, { '--format': { values: ['json', 'markdown'] } });
  const dir = resolve(parsed.positional ?? '.');
  const format = option(parsed, '--format') ?? 'json';
  const report = await buildValidationReport(dir);
  if (format === 'json') console.log(JSON.stringify(report, null, 2));
  else if (format === 'markdown') process.stdout.write(renderValidationReport(report));
  if (!report.ok) process.exitCode = 1;
}
function parseArgs(command: keyof typeof usage, args: string[], specs: Record<string, OptionSpec>, positionalRequired = false): ParsedArgs {
  const result: ParsedArgs = { options: new Map() };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) {
      if (result.positional !== undefined) usageError(command, `unexpected argument: ${token}`);
      result.positional = token;
      continue;
    }
    const spec = specs[token];
    if (!spec) usageError(command, `unknown option: ${token}`);
    if (result.options.has(token)) usageError(command, `duplicate option: ${token}`);
    if (spec.values || token !== '--json') {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) usageError(command, `missing value for ${token}`);
      if (spec.values && !spec.values.includes(value)) usageError(command, `invalid value for ${token}: ${value}`);
      result.options.set(token, value);
      index += 1;
    } else {
      result.options.set(token, true);
    }
  }
  if (positionalRequired && result.positional === undefined) usageError(command, 'missing required argument');
  return result;
}

function option(parsed: ParsedArgs, flag: string): string | undefined {
  const value = parsed.options.get(flag);
  return typeof value === 'string' ? value : undefined;
}

function usageError(command: keyof typeof usage, detail: string): never {
  throw new Error(`${detail}\nUsage: ${usage[command]}`);
}

function help() { console.log(`skillforge — portable coding-agent skill foundry\n\nCommands:\n  ${usage.init}\n  ${usage.lint}\n  ${usage.test}\n  ${usage.render}\n  ${usage.matrix}\n  ${usage.package}\n  ${usage.report}\n`); }
