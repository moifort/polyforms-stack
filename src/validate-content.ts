/**
 * Content validation, run in the package's CI: every migration and routine parses, no safe
 * migration without a check, no em or en dash in what is shipped, no identifier that belongs
 * to one project (the denylist lives outside the published files).
 */
import { readdir } from 'node:fs/promises'
import { parseFrontmatter, readMigrations } from './migrations'
import { packageDir } from './package'

const root = packageDir()
const problems: string[] = []

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
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

for (const dir of ['rules', 'routines', 'skills', 'migrations']) {
  for (const path of await walk(`${root}/${dir}`)) {
    if (!path.endsWith('.md')) continue
    const text = await Bun.file(path).text()
    const rel = path.slice(root.length + 1)
    if (/[—–]/.test(text)) problems.push(`${rel}: em or en dash`)
    for (const word of denylist) if (text.includes(word)) problems.push(`${rel}: contains ${word}`)
  }
}

for (const path of await walk(`${root}/routines`)) {
  const { data } = parseFrontmatter(await Bun.file(path).text())
  for (const key of ['id', 'scope', 'runtime', 'cadence', 'title']) {
    if (!data[key]) problems.push(`${path.slice(root.length + 1)}: frontmatter lacks ${key}`)
  }
}

try {
  for (const m of await readMigrations(root)) {
    const [file, anchor] = m.rule.split('#')
    const ruleText = await Bun.file(`${root}/${file}`)
      .text()
      .catch(() => '')
    if (!ruleText) problems.push(`${m.path}: rule file ${file} not found`)
    else if (anchor && !ruleText.toLowerCase().includes(`## ${anchor.replace(/-/g, ' ')}`))
      problems.push(`${m.path}: heading ${anchor} not found in ${file}`)
  }
} catch (error) {
  problems.push(String(error))
}

for (const p of problems) console.error(p)
console.log(problems.length === 0 ? 'content valid' : `${problems.length} problem(s)`)
process.exit(problems.length === 0 ? 0 : 1)
