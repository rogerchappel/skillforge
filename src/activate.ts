import type { ActivationFixture, ActivationResult, SkillManifest } from './types.js';

export function activationScore(manifest: SkillManifest, prompt: string): { actual: boolean; matched: string[] } {
  const haystack = prompt.toLowerCase();
  const tokens = new Set([...(manifest.activation?.keywords ?? []), manifest.name, ...(manifest.name?.split('-') ?? [])].map((t) => t.toLowerCase()).filter(Boolean));
  const matched = [...tokens].filter((token) => haystack.includes(token));
  for (const example of manifest.activation?.examples ?? []) {
    const words = example.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    if (words.some((word) => haystack.includes(word))) matched.push(`example:${example.slice(0, 24)}`);
  }
  return { actual: matched.length > 0, matched: [...new Set(matched)] };
}

export function runActivationFixtures(manifest: SkillManifest, fixtures: ActivationFixture[]): ActivationResult[] {
  return fixtures.map((fixture) => ({ ...fixture, ...activationScore(manifest, fixture.prompt) }));
}
