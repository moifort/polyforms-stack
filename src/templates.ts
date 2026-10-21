import { readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import type { Stack, StackConfig } from '~/config'
import { placeholdersIn, render } from '~/render'

/** The folders of templates/ that a project with these stacks receives, in order:
 *  base first, then one per selected stack. A later folder may add files or
 *  merge into a JSON file an earlier one wrote (`<name>.merge.json`). */
export const templateFolders = (stacks: readonly Stack[]): string[] => ['base', ...stacks]

const TEXT = new Set([
  '.md',
  '.ts',
  '.tsx',
  '.js',
  '.json',
  '.yml',
  '.yaml',
  '.toml',
  '.tf',
  '.example',
  '.sh',
  '.swift',
  '.graphql',
  '.html',
  '.css',
  '.txt',
  '.plist',
  '.xcstrings',
  '.rules',
  '.gitignore',
  '.entitlements',
  '.xcprivacy',
  '.strings',
  '.xctestplan',
  '.pbxproj',
  '.resolved',
])
export const isText = (path: string): boolean => {
  const ext = extname(path) || path.slice(path.lastIndexOf('/') + 1)
  return TEXT.has(ext) || ext === '' || path.endsWith('/tf')
}

const walk = async (dir: string): Promise<string[]> => {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(path)))
    else out.push(path)
  }
  return out.sort()
}

const deepMerge = (into: Record<string, unknown>, from: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(from)) {
    const current = into[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      deepMerge(current as Record<string, unknown>, value as Record<string, unknown>)
    } else into[key] = value
  }
  return into
}

export type TemplateFile = { path: string; content: string | Uint8Array; executable: boolean }

/** Every file the templates produce for a project, rendered, in memory. */
export const planTemplates = async (
  packageDir: string,
  config: StackConfig,
  values: Record<string, string>,
): Promise<TemplateFile[]> => {
  const files = new Map<string, TemplateFile>()
  for (const folder of templateFolders(config.stacks)) {
    const root = join(packageDir, 'templates', folder)
    for (const path of await walk(root)) {
      const rel = render(relative(root, path), values)
      const file = Bun.file(path)
      const executable = ((await file.stat()).mode & 0o111) !== 0
      if (rel.endsWith('.merge.json')) {
        const target = rel.replace(/\.merge\.json$/, '.json')
        const existing = files.get(target)
        const base =
          existing && typeof existing.content === 'string' ? JSON.parse(existing.content) : {}
        const merged = deepMerge(base, JSON.parse(render(await file.text(), values)))
        files.set(target, {
          path: target,
          content: `${JSON.stringify(merged, null, 2)}\n`,
          executable: false,
        })
        continue
      }
      if (isText(rel))
        files.set(rel, { path: rel, content: render(await file.text(), values), executable })
      else
        files.set(rel, { path: rel, content: new Uint8Array(await file.arrayBuffer()), executable })
    }
  }
  return [...files.values()]
}

/** The placeholders the templates of these stacks use. */
export const templatePlaceholders = async (
  packageDir: string,
  stacks: readonly Stack[],
): Promise<string[]> => {
  const names = new Set<string>()
  for (const folder of templateFolders(stacks)) {
    for (const path of await walk(join(packageDir, 'templates', folder))) {
      if (!isText(path)) continue
      for (const name of placeholdersIn(await Bun.file(path).text())) names.add(name)
    }
  }
  return [...names].sort()
}
