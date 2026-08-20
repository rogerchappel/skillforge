import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const expectedTag = `v${packageJson.version}`;
const suppliedTag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

if (packageJson.name !== '@rogerchappel/skillforge') {
  throw new Error(`unexpected package name: ${packageJson.name}`);
}

if (!changelog.includes(`\n## ${packageJson.version}\n`)) {
  throw new Error(`CHANGELOG.md has no ${packageJson.version} release entry`);
}

if (suppliedTag && suppliedTag !== expectedTag) {
  throw new Error(`tag ${suppliedTag} does not match package version; expected ${expectedTag}`);
}

console.log(`release metadata verified: ${packageJson.name}@${packageJson.version} -> ${expectedTag}`);
