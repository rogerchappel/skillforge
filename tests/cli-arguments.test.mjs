import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const cli = 'dist/cli.js';
const fixture = 'examples/tdd-sentinel';

function rejects(args, expected) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  assert.notEqual(result.status, 0, `${args.join(' ')} should fail`);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, expected);
  assert.match(result.stderr, /Usage: skillforge/);
}

test('commands reject missing option values before doing work', () => {
  for (const [command, args] of [
    ['init', ['demo', '--cwd']],
    ['lint', [fixture, '--format']],
    ['test', [fixture, '--fixtures']],
    ['render', [fixture, '--target']],
    ['package', [fixture, '--out']],
    ['matrix', [fixture, '--format']],
    ['report', [fixture, '--format']],
  ]) rejects([command, ...args], /missing value/);
});

test('commands reject unknown options and surplus positional arguments', () => {
  for (const command of ['lint', 'test', 'render', 'package', 'matrix', 'report']) {
    rejects([command, fixture, '--wat'], /unknown option: --wat/);
    rejects([command, fixture, 'extra'], /unexpected argument: extra/);
  }
  rejects(['init', 'demo', '--wat'], /unknown option: --wat/);
  rejects(['init', 'demo', 'extra'], /unexpected argument: extra/);
});

test('commands reject duplicate and conflicting options', () => {
  rejects(['lint', fixture, '--format', 'text', '--format', 'json'], /duplicate option: --format/);
  rejects(['lint', fixture, '--json', '--json'], /duplicate option: --json/);
  rejects(['lint', fixture, '--json', '--format', 'text'], /cannot be used together/);
  rejects(['test', fixture, '--fixtures', 'a', '--fixtures', 'b'], /duplicate option: --fixtures/);
  rejects(['render', fixture, '--target', 'openclaw', '--target', 'claude-plugin'], /duplicate option: --target/);
  rejects(['package', fixture, '--out', 'a', '--out', 'b'], /duplicate option: --out/);
  rejects(['matrix', fixture, '--format', 'json', '--format', 'markdown'], /duplicate option: --format/);
  rejects(['report', fixture, '--format', 'json', '--format', 'markdown'], /duplicate option: --format/);
  rejects(['init', 'demo', '--cwd', 'a', '--cwd', 'b'], /duplicate option: --cwd/);
});

test('enum options reject invalid values and render requires a target', () => {
  rejects(['lint', fixture, '--format', 'yaml'], /invalid value/);
  rejects(['render', fixture, '--target', 'other'], /invalid value/);
  rejects(['render', fixture], /--target is required/);
  rejects(['matrix', fixture, '--format', 'text'], /invalid value/);
  rejects(['report', fixture, '--format', 'text'], /invalid value/);
});
