import { readdir } from 'node:fs/promises'
import semver from 'semver'
import { z } from 'zod'
import { applies } from './catalogue'
import type { Stack } from './config'
import { STACKS } from './config'

export const Migration = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  risk: z.enum(['safe', 'review']),
  stacks: z.array(z.enum([...STACKS, 'any'])),
  rule: z.string(),
  check: z.string().optional(),
})
export type Migration = z.infer<typeof Migration> & { version: string; path: string; body: string }

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/

/** Reads the minimal YAML the frontmatter uses: `key: value` and `key: [a, b]`. */
export const parseFrontmatter = (text: string): { data: Record<string, unknown>; body: string } => {
  const match = FRONTMATTER.exec(text)
  if (!match) throw new Error('missing frontmatter')
  const data: Record<string, unknown> = {}
  for (const line of (match[1] as string).split('\n')) {
    const [key, ...rest] = line.split(':')
    if (!key || rest.length === 0) continue
    const raw = rest.join(':').trim()
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key.trim()] = raw
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else {
      data[key.trim()] = raw.replace(/^"(.*)"$/, '$1')
    }
  }
  return { data, body: match[2] as string }
}

export const readMigrations = async (packageDir: string): Promise<Migration[]> => {
  const root = `${packageDir}/migrations`
  const versions = await readdir(root, { withFileTypes: true }).catch(() => [])
  const found: Migration[] = []
  for (const dir of versions) {
    if (!dir.isDirectory() || !semver.valid(dir.name)) continue
    for (const file of await readdir(`${root}/${dir.name}`)) {
      if (!file.endsWith('.md')) continue
      const path = `${root}/${dir.name}/${file}`
      const { data, body } = parseFrontmatter(await Bun.file(path).text())
      const parsed = Migration.parse(data)
      if (parsed.risk === 'safe' && !parsed.check)
        throw new Error(`${path}: a safe migration needs a check`)
      found.push({ ...parsed, version: dir.name, path, body })
    }
  }
  return found.sort((a, b) => semver.compare(a.version, b.version) || a.id.localeCompare(b.id))
}

/** Migrations with from < version <= to, for the project's stacks. */
export const migrationsBetween = (
  all: Migration[],
  from: string,
  to: string,
  stacks: readonly Stack[],
): Migration[] =>
  all.filter(
    (m) =>
      semver.gt(m.version, from) &&
      semver.lte(m.version, to) &&
      (m.stacks.includes('any') || applies(m.stacks as Stack[], stacks)),
  )
