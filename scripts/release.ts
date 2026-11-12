#!/usr/bin/env bun
/**
 * Cuts a version of the package: checks CHANGELOG.md has its section, sets the version in
 * package.json, commits it alone (CHANGELOG.md must already be committed), and creates the annotated tag `vX.Y.Z` whose message is that section
 * (New, Changed, Fixed, Upgrade). Pushing the tag publishes through the Publish workflow.
 *
 *   bun run release 0.2.0
 */
import { $ } from 'bun'
import semver from 'semver'

const version = process.argv[2]
if (!version || !semver.valid(version)) throw new Error('usage: bun run release <x.y.z>')

const changelog = await Bun.file('CHANGELOG.md').text()

/** The body of a version's section, without its heading. */
export const sectionOf = (text: string, wanted: string): string | undefined => {
  const lines = text.split('\n')
  const start = lines.findIndex((line) => line.startsWith(`## ${wanted} `))
  if (start < 0) return undefined
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '))
  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join('\n')
    .trim()
}

// The release commit carries package.json alone, so CHANGELOG.md must already be committed:
// an uncommitted change there may be another session's work, which `git add` would ship.
if ((await $`git diff --quiet HEAD -- CHANGELOG.md package.json`.nothrow()).exitCode !== 0)
  throw new Error('commit CHANGELOG.md (and leave package.json untouched) before cutting a version')

const section = sectionOf(changelog, version)
if (!section) throw new Error(`CHANGELOG.md has no "## ${version} (YYYY.MM.DD)" section`)
if (!section.includes('### Upgrade'))
  throw new Error(`the ${version} section has no "### Upgrade" part: say what a project must do`)

const pkg = await Bun.file('package.json').json()
if (semver.lte(version, pkg.version) && pkg.version !== version)
  throw new Error(`${version} is not above ${pkg.version}`)
pkg.version = version
await Bun.write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

await $`bun run preflight`
await $`git commit -m ${`chore(release): ${version}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`} -- package.json`
// verbatim: the default cleanup strips the section's `###` headings as comment lines.
await $`git tag -a --cleanup=verbatim ${`v${version}`} -m ${`@moifort/stack ${version}\n\n${section}`}`
console.log(`tagged v${version}; push it with: git push origin main v${version}`)
