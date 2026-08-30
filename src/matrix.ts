import { readManifest } from './io.js';
import { declaredHosts, hasErrors, lintSkill, supportedHosts } from './lint.js';
import type { Diagnostic, HostTarget } from './types.js';

export const hostTargets: HostTarget[] = supportedHosts;

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
  const hosts = declaredHosts(manifest.hosts);
  const hostsInvalid = errors.some((diagnostic) => diagnostic.code === 'manifest.hosts');

  const rows = hostTargets.map((target) => {
    const declared = hosts.includes(target);
    const blockers = declared || hostsInvalid ? errors : [];
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
    ok: !hostsInvalid && rows.filter((row) => row.declared).every((row) => row.renderable),
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
