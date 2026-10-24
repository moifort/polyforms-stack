import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { $ } from 'bun'
import { packageDir } from './package'

// The CLI as npm serves it: packed, extracted outside this repository, so nothing resolves
// through files the package does not ship (a tsconfig, a path alias, a dev dependency).
let work: string
beforeAll(async () => {
  work = await mkdtemp(join(tmpdir(), 'stack-pack-'))
  await $`bun pm pack --destination ${work} --quiet`.cwd(packageDir()).quiet()
  const tarball = (await readdir(work)).find((f) => f.endsWith('.tgz'))
  if (!tarball) throw new Error('bun pm pack produced no tarball')
  await $`tar -xzf ${tarball}`.cwd(work).quiet()
  await $`bun install --production --silent`.cwd(join(work, 'package')).quiet()
})
afterAll(async () => {
  await rm(work, { recursive: true, force: true })
})

describe('the packed package', () => {
  test('runs its CLI', async () => {
    const out = await $`bun ${join(work, 'package/bin/stack.ts')} placeholders --stacks backend,ios`
      .cwd(work)
      .text()
    expect(out).toContain('APP_NAME')
  })
})
