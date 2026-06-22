import type { ActivationFixture, ActivationResult, SkillManifest } from './types.js';

export function activationScore(manifest: SkillManifest, prompt: string): { actual: boolean; matched: string[]; blockedBy: string[] } {
  const haystack = prompt.toLowerCase();
  const tokens = new Set([...(manifest.activation?.keywords ?? []), manifest.name, ...(manifest.name?.split('-') ?? [])].map((t) => t.toLowerCase()).filter(Boolean));
  const matched = [...tokens].filter((token) => haystack.includes(token));
  const blockedBy: string[] = [];
  for (const example of manifest.activation?.examples ?? []) {
    const words = example.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    if (words.some((word) => haystack.includes(word))) matched.push(`example:${example.slice(0, 24)}`);
  }
  for (const antiExample of manifest.activation?.antiExamples ?? []) {
    const words = antiExample.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
    if (words.length > 0 && words.every((word) => haystack.includes(word))) blockedBy.push(`antiExample:${antiExample.slice(0, 24)}`);
  }
  return { actual: matched.length > 0 && blockedBy.length === 0, matched: [...new Set(matched)], blockedBy: [...new Set(blockedBy)] };
}

export function runActivationFixtures(manifest: SkillManifest, fixtures: ActivationFixture[]): ActivationResult[] {
  return fixtures.map((fixture) => ({ ...fixture, ...activationScore(manifest, fixture.prompt) }));
}
