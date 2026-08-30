import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const expectedTag = `v${packageJson.version}`;
const args = process.argv.slice(2);
const dryRun = args[0] === '--dry-run';
const workflowTag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined;
const suppliedTag = dryRun ? args[1] : args[0] ?? workflowTag;

if (packageJson.name !== '@rogerchappel/skillforge') {
  throw new Error(`unexpected package name: ${packageJson.name}`);
}

if (!changelog.includes(`\n## ${packageJson.version}\n`)) {
  throw new Error(`CHANGELOG.md has no ${packageJson.version} release entry`);
}

if (suppliedTag && suppliedTag !== expectedTag) {
  throw new Error(`tag ${suppliedTag} does not match package version; expected ${expectedTag}`);
}

if (dryRun) {
  if (!suppliedTag) {
    throw new Error(`dry-run verification requires the expected tag argument: ${expectedTag}`);
  }
} else {
  let tagCommit;
  try {
    tagCommit = execFileSync('git', ['rev-list', '-n', '1', expectedTag], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    throw new Error(`expected release tag ${expectedTag} is missing; create or fetch it, or use --dry-run ${expectedTag} before tagging`);
  }

  const headCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  }).trim();
  if (tagCommit !== headCommit) {
    throw new Error(`tag ${expectedTag} points to ${tagCommit}, not current HEAD ${headCommit}`);
  }
}

console.log(`release metadata verified${dryRun ? ' (dry run)' : ''}: ${packageJson.name}@${packageJson.version} -> ${expectedTag}`);
