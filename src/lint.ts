import { join } from 'node:path';
import { exists, readManifest, readText } from './io.js';
import type { Diagnostic, HostTarget, SkillManifest } from './types.js';

export const supportedHosts: HostTarget[] = ['openclaw', 'claude-plugin'];

export function declaredHosts(value: unknown): HostTarget[] {
  if (!Array.isArray(value)) return [];
  return value.filter((host): host is HostTarget => supportedHosts.includes(host as HostTarget));
}

export async function lintSkill(dir: string): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  if (!(await exists(join(dir, 'skill.yaml')))) return [{ level: 'error', code: 'manifest.missing', message: 'Missing skill.yaml manifest.' }];
  let manifest: SkillManifest;
  try { manifest = await readManifest(dir); } catch (error) { return [{ level: 'error', code: 'manifest.parse', message: String(error) }]; }
  requireString(manifest.name, 'manifest.name', diagnostics);
  requireString(manifest.description, 'manifest.description', diagnostics);
  if (!manifest.version) diagnostics.push(error('manifest.version', 'Manifest must include version.'));
  if (!Array.isArray(manifest.hosts) || manifest.hosts.length === 0) {
    diagnostics.push(error('manifest.hosts', 'hosts must be a non-empty array containing only: openclaw, claude-plugin.'));
  } else if (manifest.hosts.some((host) => typeof host !== 'string' || !supportedHosts.includes(host as HostTarget))) {
    diagnostics.push(error('manifest.hosts', 'hosts must contain only supported values: openclaw, claude-plugin.'));
  }
  if (!manifest.activation?.examples?.length) diagnostics.push(error('activation.examples', 'Add activation examples so agents know when to use this skill.'));
  if ((manifest.description ?? '').split(/\s+/).length < 8) diagnostics.push(warn('activation.vague', 'Description is very short; make activation behavior specific.'));
  if (!manifest.verification?.length) diagnostics.push(warn('verification.missing', 'Add verification steps to prevent hand-wavy completion.'));
  if (!manifest.safety?.notes?.length) diagnostics.push(warn('safety.missing', 'Add safety notes, especially for external writes or destructive work.'));
  if (manifest.safety?.externalWrites === 'allowed') diagnostics.push(warn('safety.external-writes', 'External writes are allowed; prefer ask-first unless the skill is tightly scoped.'));
  for (const file of manifest.files ?? []) if (!(await exists(join(dir, file)))) diagnostics.push(error('file.missing', `Required file listed in manifest is missing: ${file}`, file));
  for (const file of manifest.files ?? []) {
    if (!file.endsWith('.md') || !(await exists(join(dir, file)))) continue;
    const text = await readText(join(dir, file));
    if (/\b(rm -rf|sudo |curl\s+[^|]*\|\s*sh|npm publish|git push --force)\b/.test(text)) diagnostics.push(warn('markdown.unsafe-command', `Potentially unsafe command in ${file}; document consent and rollback.`, file));
    if (/Claude Code|OpenClaw|Cursor|Gemini/.test(text) && declaredHosts(manifest.hosts).length > 1) diagnostics.push(warn('markdown.host-specific', `Host-specific wording found in portable file ${file}.`, file));
  }
  return diagnostics;
}

function requireString(value: unknown, code: string, diagnostics: Diagnostic[]) { if (typeof value !== 'string' || !value.trim()) diagnostics.push(error(code, `${code} must be a non-empty string.`)); }
function error(code: string, message: string, file?: string): Diagnostic { return { level: 'error', code, message, file }; }
function warn(code: string, message: string, file?: string): Diagnostic { return { level: 'warning', code, message, file }; }
export function hasErrors(diagnostics: Diagnostic[]): boolean { return diagnostics.some((d) => d.level === 'error'); }
