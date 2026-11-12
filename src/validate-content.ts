/**
 * Content validation, run in the package's CI. What the prose claims must exist:
 *
 * - every migration and routine parses, no safe migration without a check, and every
 *   migration is listed in its version's section of CHANGELOG.md, newest version first;
 * - no em or en dash in the rules, routines, skills and migrations;
 * - no identifier or name that belongs to one project, in anything a project receives
 *   (the denylist lives outside the published files), and no tracked file holds a string
 *   in the format of a credential;
 * - every relative link and anchor resolves;
 * - every `bun run <script>` named exists in a template's package.json;
 * - every `stack <command>` named is a command of the CLI, unless the file says the
 *   command is not shipped yet;
 * - every file the catalogue ties to a stack exists.
 */
import { readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import semver from 'semver'
import { HOOK_STACKS, ROUTINE_STACKS, RULE_STACKS, SKILL_STACKS } from './catalogue'
import { STACKS } from './config'
import { parseFrontmatter, readMigrations } from './migrations'
import { packageDir } from './package'
import { isText } from './templates'

const root = packageDir()
const problems: string[] = []
const relative = (path: string) => path.slice(root.length + 1)

const walk = async (dir: string): Promise<string[]> => {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) out.push(...(await walk(path)))
    else out.push(path)
  }
  return out
}

const denylist = (
  await Bun.file(`${root}/.denylist`)
    .text()
    .catch(() => '')
)
  .split('\n')
  .map((l) => l.trim().toLowerCase())
  .filter((l) => l && !l.startsWith('#'))

/** The prose Claude reads in a project: the claims checked below are made there. */
const prose: { path: string; text: string }[] = []
for (const dir of ['rules', 'routines', 'skills', 'migrations']) {
  for (const path of await walk(`${root}/${dir}`)) {
    if (path.endsWith('.md')) prose.push({ path, text: await Bun.file(path).text() })
  }
}

for (const { path, text } of prose) {
  if (/[—–]/.test(text)) problems.push(`${relative(path)}: em or en dash`)
}

// Everything a project receives, templates and hooks included, names no single project.
for (const dir of ['rules', 'routines', 'skills', 'migrations', 'hooks', 'templates']) {
  for (const path of await walk(`${root}/${dir}`)) {
    if (!isText(path)) continue
    const text = (await Bun.file(path).text()).toLowerCase()
    for (const word of denylist)
      if (text.includes(word)) problems.push(`${relative(path)}: contains ${word}`)
  }
}

// Nothing tracked holds a string in the format of a credential, made-up ones included: the
// repository is public, and a scanner cannot tell a placeholder from a leak.
const CREDENTIALS: [string, RegExp][] = [
  ['a Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['a GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/],
  ['an Anthropic key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['a Sentry token', /\bsntry[su]_[A-Za-z0-9_+/=-]{20,}/],
  ['a private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
]
const tracked = (await Bun.$`git -C ${root} ls-files`.nothrow().text()).split('\n').filter(Boolean)
for (const file of tracked) {
  if (!isText(file)) continue
  const text = await Bun.file(`${root}/${file}`)
    .text()
    .catch(() => '')
  for (const [name, pattern] of CREDENTIALS)
    if (pattern.test(text)) problems.push(`${file}: holds a string in the format of ${name}`)
}

for (const path of await walk(`${root}/routines`)) {
  const { data } = parseFrontmatter(await Bun.file(path).text())
  for (const key of ['id', 'scope', 'runtime', 'cadence', 'title']) {
    if (!data[key]) problems.push(`${relative(path)}: frontmatter lacks ${key}`)
  }
}

/** A heading's anchor, as GitHub derives it. */
const anchorOf = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-')

const anchorsIn = (text: string): string[] =>
  [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => anchorOf(m[1] as string))

for (const { path, text } of prose) {
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const link = match[1] as string
    if (/^[a-z]+:/.test(link)) continue
    const [file, anchor] = link.split('#')
    const target = file ? resolve(dirname(path), file) : path
    const targetText = await Bun.file(target)
      .text()
      .catch(() => undefined)
    if (targetText === undefined) problems.push(`${relative(path)}: link to missing ${link}`)
    else if (anchor && !anchorsIn(targetText).includes(anchor))
      problems.push(`${relative(path)}: no heading for ${link}`)
  }
}

const scripts = new Set<string>()
for (const path of await walk(`${root}/templates`)) {
  if (!/\/package(\.merge)?\.json$/.test(path)) continue
  const { scripts: found } = (await Bun.file(path).json()) as { scripts?: Record<string, string> }
  for (const name of Object.keys(found ?? {})) scripts.add(name)
}
const commands = new Set(
  [...(await Bun.file(`${root}/bin/stack.ts`).text()).matchAll(/case '([a-z]+)':/g)].map(
    (m) => m[1] as string,
  ),
)
for (const { path, text } of prose) {
  for (const match of text.matchAll(/bun run ([a-z][a-z0-9:-]*)/g)) {
    const script = (match[1] as string).replace(/[:-]$/, '')
    if (!scripts.has(script))
      problems.push(`${relative(path)}: \`bun run ${script}\` is in no template's package.json`)
  }
  const planned = /not shipped yet/i.test(text)
  for (const match of text.matchAll(/bunx (?:@moifort\/)?stack ([a-z]+)/g)) {
    const command = match[1] as string
    if (!commands.has(command) && !planned)
      problems.push(`${relative(path)}: \`stack ${command}\` is not a command of the CLI`)
  }
}

// The install skill's table of stacks follows the catalogue: each stack has its row, the rules
// the row names are the ones the catalogue ties to that stack, and it names each skill tied to it.
const installSkill = await Bun.file(`${root}/skills/stack-install/SKILL.md`).text()
for (const stack of STACKS) {
  const row = installSkill.split('\n').find((line) => line.startsWith(`| \`${stack}\` |`))
  if (!row) {
    problems.push(`skills/stack-install/SKILL.md: no row for the ${stack} stack`)
    continue
  }
  const named = [...(row.split('|')[2] ?? '').matchAll(/`(\d\d)`/g)].map((m) => m[1]).sort()
  const selected = Object.entries(RULE_STACKS)
    .filter(([, stacks]) => stacks.includes(stack))
    .map(([file]) => file.slice(0, 2))
    .sort()
  if (named.join() !== selected.join())
    problems.push(
      `skills/stack-install/SKILL.md: the ${stack} row names rules ${named.join(', ') || 'none'}, the catalogue selects ${selected.join(', ') || 'none'}`,
    )
  for (const [skill, stacks] of Object.entries(SKILL_STACKS))
    if (stacks.includes(stack) && !(row.split('|')[3] ?? '').includes(`\`${skill}\``))
      problems.push(`skills/stack-install/SKILL.md: the ${stack} row lacks the ${skill} skill`)
}

for (const [dir, catalogue] of [
  ['rules', RULE_STACKS],
  ['routines', ROUTINE_STACKS],
  ['skills', SKILL_STACKS],
  ['hooks', HOOK_STACKS],
] as const) {
  const present = new Set(await readdir(`${root}/${dir}`).catch(() => []))
  for (const name of Object.keys(catalogue))
    if (!present.has(name)) problems.push(`src/catalogue.ts: ${dir}/${name} does not exist`)
}

try {
  const changelog = await Bun.file(`${root}/CHANGELOG.md`).text()
  const versions = [...changelog.matchAll(/^## (\d+\.\d+\.\d+) /gm)].map((m) => m[1] as string)
  versions.forEach((version, index) => {
    const older = versions[index + 1]
    if (older && !semver.gt(version, older))
      problems.push(`CHANGELOG.md: ${version} sits above ${older}, newest first`)
  })
  for (const m of await readMigrations(root)) {
    const [file, anchor] = m.rule.split('#')
    const ruleText = await Bun.file(`${root}/${file}`)
      .text()
      .catch(() => '')
    if (!ruleText) problems.push(`${relative(m.path)}: rule file ${file} not found`)
    else if (anchor && !anchorsIn(ruleText).includes(anchor))
      problems.push(`${relative(m.path)}: heading ${anchor} not found in ${file}`)
    const start = changelog.indexOf(`\n## ${m.version} `)
    const end = changelog.indexOf('\n## ', start + 1)
    const section = start < 0 ? '' : changelog.slice(start, end < 0 ? undefined : end)
    if (!section.includes(`\`${m.id}\``))
      problems.push(`${relative(m.path)}: not listed in the ${m.version} section of CHANGELOG.md`)
  }
} catch (error) {
  problems.push(String(error))
}

for (const p of problems) console.error(p)
console.log(problems.length === 0 ? 'content valid' : `${problems.length} problem(s)`)
process.exit(problems.length === 0 ? 0 : 1)
