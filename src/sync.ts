import { chmod, mkdir, readdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { applies, HOOK_STACKS, ROUTINE_STACKS, RULE_STACKS, SKILL_STACKS } from './catalogue'
import type { StackConfig } from './config'
import { render } from './render'
import { planTemplates } from './templates'

export type Plan = {
  /** Files to write in the project, path relative to the project root, with their content. */
  files: Map<string, string>
  /** The lines the CLAUDE.md rules block must hold. */
  ruleImports: string[]
}

const RULES_BLOCK_START = '<!-- stack:rules -->'
const RULES_BLOCK_END = '<!-- /stack:rules -->'

const listFiles = async (dir: string, filter: (name: string) => boolean): Promise<string[]> =>
  (await readdir(dir).catch(() => [])).filter(filter).sort()

/** Everything sync would write, computed before anything is written: a missing placeholder fails here. */
export const planSync = async (
  packageDir: string,
  config: StackConfig,
  version: string,
): Promise<Plan> => {
  const files = new Map<string, string>()
  const values = { ...config.placeholders, STACK_VERSION: version }
  const { stacks, exclude } = config

  const rules = await listFiles(`${packageDir}/rules`, (f) => f.endsWith('.md'))
  const ruleImports: string[] = []
  for (const name of rules) {
    if (!applies(RULE_STACKS[name], stacks) || exclude.includes(name)) continue
    const text = await Bun.file(`${packageDir}/rules/${name}`).text()
    files.set(`stack/rules/${name}`, render(text, values))
    ruleImports.push(`@stack/rules/${name}`)
  }

  const routines = await listFiles(`${packageDir}/routines`, (f) => f.endsWith('.md'))
  for (const name of routines) {
    if (!applies(ROUTINE_STACKS[name], stacks)) continue
    const text = await Bun.file(`${packageDir}/routines/${name}`).text()
    files.set(`stack/routines/${name}`, render(text, values))
  }

  const skills = await readdir(`${packageDir}/skills`, { withFileTypes: true }).catch(() => [])
  for (const skill of skills) {
    if (!skill.isDirectory() || !applies(SKILL_STACKS[skill.name], stacks)) continue
    for (const file of await listFiles(`${packageDir}/skills/${skill.name}`, () => true)) {
      const text = await Bun.file(`${packageDir}/skills/${skill.name}/${file}`).text()
      files.set(`.claude/skills/${skill.name}/${file}`, text)
    }
  }

  const hooks = await listFiles(`${packageDir}/hooks`, (f) => f.endsWith('.sh'))
  for (const name of hooks) {
    if (!applies(HOOK_STACKS[name], stacks)) continue
    files.set(`.claude/hooks/${name}`, await Bun.file(`${packageDir}/hooks/${name}`).text())
  }

  files.set('stack/VERSION', `${version}\n`)
  return { files, ruleImports }
}

/** Rewrites the rules block of a CLAUDE.md; adds it at the top when absent. */
export const withRulesBlock = (claudeMd: string, imports: string[]): string => {
  const block = [RULES_BLOCK_START, ...imports, RULES_BLOCK_END].join('\n')
  const start = claudeMd.indexOf(RULES_BLOCK_START)
  const end = claudeMd.indexOf(RULES_BLOCK_END)
  if (start >= 0 && end > start) {
    return claudeMd.slice(0, start) + block + claudeMd.slice(end + RULES_BLOCK_END.length)
  }
  const lines = claudeMd.split('\n')
  const title = lines.findIndex((l) => l.startsWith('# '))
  if (title >= 0) {
    lines.splice(title + 1, 0, '', block)
    return lines.join('\n')
  }
  return `${block}\n\n${claudeMd}`
}

/** The hook registrations sync adds to .claude/settings.json. */
export const withHooks = (
  settings: Record<string, unknown>,
  hookFiles: string[],
): Record<string, unknown> => {
  const hooks = (settings.hooks ?? {}) as Record<string, unknown[]>
  const post = [...((hooks.PostToolUse as unknown[] | undefined) ?? [])]
  for (const file of hookFiles) {
    const command = `.claude/hooks/${file}`
    const already = post.some((entry) => JSON.stringify(entry).includes(command))
    if (!already) post.push({ matcher: 'Bash', hooks: [{ type: 'command', command }] })
  }
  return { ...settings, hooks: { ...hooks, PostToolUse: post } }
}

/** Writes the templates into a project that does not have them yet: a file that
 *  already exists is left alone, so init on an existing project adds what is
 *  missing and overwrites nothing. */
export const applyTemplates = async (
  packageDir: string,
  projectDir: string,
  config: StackConfig,
  values: Record<string, string>,
): Promise<{ written: string[]; kept: string[] }> => {
  const written: string[] = []
  const kept: string[] = []
  for (const file of await planTemplates(packageDir, config, values)) {
    const target = join(projectDir, file.path)
    if (await Bun.file(target).exists()) {
      kept.push(file.path)
      continue
    }
    await mkdir(dirname(target), { recursive: true })
    await Bun.write(target, file.content)
    if (file.executable) await chmod(target, 0o755)
    written.push(file.path)
  }
  return { written, kept }
}

export const applyPlan = async (projectDir: string, plan: Plan): Promise<void> => {
  await rm(join(projectDir, 'stack/rules'), { recursive: true, force: true })
  await rm(join(projectDir, 'stack/routines'), { recursive: true, force: true })
  for (const [path, content] of plan.files) {
    const target = join(projectDir, path)
    await mkdir(dirname(target), { recursive: true })
    await Bun.write(target, content)
  }
  const claudePath = join(projectDir, 'CLAUDE.md')
  const claudeFile = Bun.file(claudePath)
  const claude = (await claudeFile.exists()) ? await claudeFile.text() : '# Project\n'
  await Bun.write(claudePath, withRulesBlock(claude, plan.ruleImports))
  const hookFiles = [...plan.files.keys()]
    .filter((p) => p.startsWith('.claude/hooks/'))
    .map((p) => p.slice('.claude/hooks/'.length))
  if (hookFiles.length > 0) {
    const settingsPath = join(projectDir, '.claude/settings.json')
    const settingsFile = Bun.file(settingsPath)
    const settings = (await settingsFile.exists()) ? await settingsFile.json() : {}
    await mkdir(dirname(settingsPath), { recursive: true })
    await Bun.write(settingsPath, `${JSON.stringify(withHooks(settings, hookFiles), null, 2)}\n`)
  }
}

/** The differences between the project and what sync would produce; empty when in sync. */
export const checkPlan = async (projectDir: string, plan: Plan): Promise<string[]> => {
  const problems: string[] = []
  for (const [path, content] of plan.files) {
    const file = Bun.file(join(projectDir, path))
    if (!(await file.exists())) problems.push(`${path}: missing`)
    else if ((await file.text()) !== content) problems.push(`${path}: differs from sync`)
    if (/\{\{[A-Z][A-Z0-9_]*\}\}/.test(content)) problems.push(`${path}: raw placeholder left`)
  }
  const claudeFile = Bun.file(join(projectDir, 'CLAUDE.md'))
  const claude = (await claudeFile.exists()) ? await claudeFile.text() : ''
  if (withRulesBlock(claude, plan.ruleImports) !== claude)
    problems.push('CLAUDE.md: rules block out of date')
  return problems
}
