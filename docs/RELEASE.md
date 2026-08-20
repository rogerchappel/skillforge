# Maintainer release procedure

Releases are published only by the tag-triggered `Release` workflow. Pull
requests and the manually dispatched `Release dry run` workflow never publish.

For the current package version:

1. Start from a clean checkout of `main` and run `git pull --ff-only`.
2. Confirm `package.json` and `CHANGELOG.md` describe the intended version.
3. Run `npm ci && npm run release:check`.
4. Set `VERSION=$(node -p "require('./package.json').version")` and run
   `npm run release:verify -- "v$VERSION"`.
5. Confirm the tag does not exist with `git ls-remote --exit-code --tags origin
   "refs/tags/v$VERSION"`; exit status 2 means it is available. Any returned tag
   is a stop condition.
6. Create the annotated tag with `git tag -a "v$VERSION" -m "Release v$VERSION"`
   and push only that tag with `git push origin "v$VERSION"`.
7. Watch the `Release` workflow. It reruns the full release check, publishes
   `@rogerchappel/skillforge` with npm provenance, and creates the matching
   GitHub release with the packed artifact.
8. After success, verify `npm view @rogerchappel/skillforge@"$VERSION" version`
   and `gh release view "v$VERSION"` before treating the README install command
   as available.

Do not run `npm publish` or create the GitHub release by hand. If the workflow
fails before publishing, fix the failure and replace the unshipped tag only
after confirming that neither npm nor GitHub contains the release. If npm was
published, do not reuse the version.
