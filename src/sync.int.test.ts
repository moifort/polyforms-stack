import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { requiredPlaceholders } from '~/init'
import { packageDir } from '~/package'
import { applyPlan, checkPlan, planSync, withHooks, withRulesBlock } from '~/sync'

let project: string
beforeEach(async () => {
  project = await mkdtemp(join(tmpdir(), 'stack-'))
})
afterEach(async () => {
  await rm(project, { recursive: true, force: true })
})

const values = async (stacks: ('backend' | 'ios' | 'ai' | 'site')[]) => {
  const placeholders: Record<string, string> = {}
  for (const name of await requiredPlaceholders(packageDir(), stacks))
    placeholders[name] = `<${name}>`
  return placeholders
}

describe('sync', () => {
  test('a project without the ios stack gets no ios rule, skill or hook', async () => {
    const plan = await planSync(
      packageDir(),
      { stacks: ['backend'], placeholders: await values(['backend']), exclude: [] },
      '1.0.0',
    )
    const paths = [...plan.files.keys()]
    expect(paths).toContain('stack/rules/00-collaboration.md')
    expect(paths).toContain('stack/rules/09-backend.md')
    expect(paths).not.toContain('stack/rules/10-ios.md')
    expect(paths.some((p) => p.includes('shutdown-simulators'))).toBe(false)
    expect(paths).toContain('stack/VERSION')
  })

  test('fails before writing when a placeholder has no value', async () => {
    await expect(
      planSync(packageDir(), { stacks: ['backend'], placeholders: {}, exclude: [] }, '1.0.0'),
    ).rejects.toThrow('missing placeholder value')
  })

  test('applies, then checks clean; a hand edit and a stale block are reported', async () => {
    const config = {
      stacks: ['backend', 'ios'] as const,
      placeholders: await values(['backend', 'ios']),
      exclude: [],
    }
    const plan = await planSync(packageDir(), { ...config, stacks: [...config.stacks] }, '1.0.0')
    await applyPlan(project, plan)
    expect(await checkPlan(project, plan)).toEqual([])
    const rendered = await Bun.file(join(project, 'stack/rules/00-collaboration.md')).text()
    expect(rendered).not.toMatch(/\{\{[A-Z_]+\}\}/)
    const claude = await Bun.file(join(project, 'CLAUDE.md')).text()
    expect(claude).toContain('@stack/rules/10-ios.md')
    const settings = await Bun.file(join(project, '.claude/settings.json')).json()
    expect(JSON.stringify(settings.hooks.PostToolUse)).toContain(
      'shutdown-simulators-after-push.sh',
    )

    await Bun.write(join(project, 'stack/rules/00-collaboration.md'), 'edited by hand\n')
    await Bun.write(join(project, 'CLAUDE.md'), '# P\n')
    const problems = await checkPlan(project, plan)
    expect(problems).toContain('stack/rules/00-collaboration.md: differs from sync')
    expect(problems).toContain('CLAUDE.md: rules block out of date')
  })

  test('running twice gives the same files', async () => {
    const config = {
      stacks: ['backend'] as 'backend'[],
      placeholders: await values(['backend']),
      exclude: [],
    }
    const plan = await planSync(packageDir(), config, '1.0.0')
    await applyPlan(project, plan)
    await applyPlan(project, plan)
    expect(await checkPlan(project, plan)).toEqual([])
  })
})

describe('templates', () => {
  test('the base template gives the project its .gitignore', async () => {
    const { planTemplates } = await import('~/templates')
    const files = await planTemplates(
      packageDir(),
      { stacks: ['backend'], placeholders: await values(['backend']), exclude: [] },
      { ...(await values(['backend'])), STACK_VERSION: '1.0.0', TODAY: '2026-10-21' },
    )
    const paths = files.map((f) => f.path)
    expect(paths).toContain('.gitignore')
    expect(paths).not.toContain('gitignore')
  })
})

describe('withRulesBlock', () => {
  test('inserts the block under the title, then replaces it in place', () => {
    const once = withRulesBlock('# App\n\nText\n', ['@stack/rules/a.md'])
    expect(once).toBe(
      '# App\n\n<!-- stack:rules -->\n@stack/rules/a.md\n<!-- /stack:rules -->\n\nText\n',
    )
    const twice = withRulesBlock(once, ['@stack/rules/b.md'])
    expect(twice).toBe(
      '# App\n\n<!-- stack:rules -->\n@stack/rules/b.md\n<!-- /stack:rules -->\n\nText\n',
    )
  })
})

describe('withHooks', () => {
  test('registers a hook once and keeps what was there', () => {
    const once = withHooks({ permissions: { allow: [] } }, ['x.sh'])
    const twice = withHooks(once, ['x.sh'])
    expect((twice.hooks as { PostToolUse: unknown[] }).PostToolUse).toHaveLength(1)
    expect(twice.permissions).toEqual({ allow: [] })
  })
})
