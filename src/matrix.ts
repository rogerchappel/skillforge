import { readManifest } from './io.js';
import { hasErrors, lintSkill } from './lint.js';
import type { Diagnostic, HostTarget } from './types.js';

export const hostTargets: HostTarget[] = ['openclaw', 'claude-plugin'];

export interface CompatibilityMatrixRow {
  target: HostTarget;
  declared: boolean;
  renderable: boolean;
  blockers: Diagnostic[];
  warnings: Diagnostic[];
}

export interface CompatibilityMatrix {
  skill: string;
  version: string;
  ok: boolean;
  rows: CompatibilityMatrixRow[];
}

export async function buildCompatibilityMatrix(dir: string): Promise<CompatibilityMatrix> {
  const manifest = await readManifest(dir);
  const diagnostics = await lintSkill(dir);
  const errors = diagnostics.filter((diagnostic) => diagnostic.level === 'error');
  const warnings = diagnostics.filter((diagnostic) => diagnostic.level === 'warning');

  const rows = hostTargets.map((target) => {
    const declared = manifest.hosts.includes(target);
    const blockers = declared ? errors : [...errors, { level: 'error' as const, code: 'host.not-declared', message: `Skill does not declare support for ${target}.` }];
    return {
      target,
      declared,
      renderable: declared && !hasErrors(blockers),
      blockers,
      warnings
    };
  });

  return {
    skill: manifest.name,
    version: manifest.version,
    ok: rows.every((row) => row.renderable),
    rows
  };
}

export function renderCompatibilityMatrix(matrix: CompatibilityMatrix): string {
  const lines = [
    `# Compatibility Matrix: ${matrix.skill}`,
    '',
    `Version: ${matrix.version}`,
    `Overall: ${matrix.ok ? 'ok' : 'needs attention'}`,
    '',
    '| Target | Declared | Renderable | Blockers | Warnings |',
    '|---|---:|---:|---|---|',
    ...matrix.rows.map((row) => `| ${row.target} | ${row.declared ? 'yes' : 'no'} | ${row.renderable ? 'yes' : 'no'} | ${row.blockers.map((item) => item.code).join(', ') || 'none'} | ${row.warnings.map((item) => item.code).join(', ') || 'none'} |`),
    ''
  ];
  return `${lines.join('\n')}\n`;
}
