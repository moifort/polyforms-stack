#!/usr/bin/env bun
/**
 * Cuts a version of the package: checks CHANGELOG.md has its section, sets the version in
 * package.json, commits, and creates the annotated tag `vX.Y.Z` whose message is that section
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
await $`git add package.json CHANGELOG.md`
await $`git commit -m ${`chore(release): ${version}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`}`.nothrow()
await $`git tag -a ${`v${version}`} -m ${`@moifort/stack ${version}\n\n${section}`}`
console.log(`tagged v${version}; push it with: git push origin main v${version}`)
