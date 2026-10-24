import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { $ } from 'bun'
import { defaultPlaceholders, requiredPlaceholders } from './init'
import { packageDir } from './package'
import { applyTemplates } from './sync'

// A generated project passes its own lint whatever the app is called: a placeholder that
// changes a line's length must not change how the formatter lays that line out.
const dirs: string[] = []
afterEach(async () => {
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true })
})

const generate = async (name: string): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'stack-lint-'))
  dirs.push(dir)
  await $`git init -q`.cwd(dir)
  const stacks = ['backend', 'ios'] as const
  const values: Record<string, string> = {
    ...defaultPlaceholders(dir),
    APP_NAME: name,
    APP_SLUG: name.toLowerCase(),
  }
  const required = await requiredPlaceholders(packageDir(), [...stacks])
  const placeholders = Object.fromEntries(required.map((n) => [n, values[n] ?? `<${n}>`]))
  await applyTemplates(
    packageDir(),
    dir,
    { stacks: [...stacks], placeholders, exclude: [] },
    {
      ...placeholders,
      STACK_VERSION: '0.0.0',
      TODAY: '2026-01-01',
    },
  )
  return dir
}

const biome = join(packageDir(), 'node_modules/.bin/biome')

describe('generated project', () => {
  for (const name of ['Maison', 'Bibliothequeuniverselledesobjets']) {
    test(`is lint clean when the app is called ${name}`, async () => {
      const dir = await generate(name)
      // The bin is a node script: run it with bun, node may not be installed.
      const result = await $`bun ${biome} check`.cwd(dir).nothrow().quiet()
      const output =
        result.exitCode === 0 ? '' : result.stderr.toString() + result.stdout.toString()
      expect(output).toBe('')
    })
  }
})
