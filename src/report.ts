import { buildCompatibilityMatrix } from './matrix.js';
import { hasErrors, lintSkill } from './lint.js';
import { readManifest } from './io.js';
import type { Diagnostic, HostTarget } from './types.js';

export interface ValidationReport {
  manifest: string;
  hosts: HostTarget[];
  ok: boolean;
  diagnostics: Diagnostic[];
  counts: {
    errors: number;
    warnings: number;
  };
  matrix: {
    ok: boolean;
    hostCount: number;
  };
}

export async function buildValidationReport(dir: string): Promise<ValidationReport> {
  const manifest = await readManifest(dir);
  const diagnostics = await lintSkill(dir);
  const matrix = await buildCompatibilityMatrix(dir);
  const counts = {
    errors: diagnostics.filter((diagnostic) => diagnostic.level === 'error').length,
    warnings: diagnostics.filter((diagnostic) => diagnostic.level === 'warning').length
  };
  return {
    manifest: manifest.name,
    hosts: manifest.hosts,
    ok: !hasErrors(diagnostics) && matrix.ok,
    diagnostics,
    counts,
    matrix: {
      ok: matrix.ok,
      hostCount: matrix.rows.length
    }
  };
}

export function renderValidationReport(report: ValidationReport): string {
  const lines = [
    '# SkillForge Validation Report',
    '',
    `Skill: ${report.manifest}`,
    `Status: ${report.ok ? 'ok' : 'blocked'}`,
    `Hosts: ${report.hosts.join(', ')}`,
    `Errors: ${report.counts.errors}`,
    `Warnings: ${report.counts.warnings}`,
    `Matrix: ${report.matrix.ok ? 'ok' : 'blocked'} (${report.matrix.hostCount} host(s))`,
    ''
  ];
  if (report.diagnostics.length > 0) {
    lines.push('## Diagnostics', '');
    for (const diagnostic of report.diagnostics) {
      lines.push(`- ${diagnostic.level.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`);
    }
  }
  return `${lines.join('\n').trim()}\n`;
}
