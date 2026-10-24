#!/usr/bin/env bun
import { parseArgs } from 'node:util'
import { readConfig, STACKS, type Stack } from '../src/config'
import { defaultPlaceholders, requiredPlaceholders, writeConfig } from '../src/init'
import { migrationsBetween, readMigrations } from '../src/migrations'
import { packageDir, packageVersion } from '../src/package'
import { applyPlan, applyTemplates, checkPlan, planSync } from '../src/sync'

const usage = `stack <command>

  init --stacks backend,ios --set APP_NAME=Name --set MAIN_BRANCH=main   write stack.config.json, then sync
  sync                                                                   render rules, routines, skills, hooks into the project
  check                                                                  non-zero when the project differs from sync
  migrations <from> <to> [--json]                                        the migrations between two versions, for the project's stacks
  placeholders --stacks backend,ios                                      the placeholders those stacks need
`

const main = async (argv: string[]): Promise<number> => {
  const [command, ...rest] = argv
  const projectDir = process.cwd()
  const pkg = packageDir()
  const version = await packageVersion()

  switch (command) {
    case 'init': {
      const { values } = parseArgs({
        args: rest,
        options: { stacks: { type: 'string' }, set: { type: 'string', multiple: true } },
      })
      const stacks = (values.stacks ?? '').split(',').filter(Boolean) as Stack[]
      for (const s of stacks)
        if (!STACKS.includes(s)) throw new Error(`unknown stack ${s}; known: ${STACKS.join(', ')}`)
      const placeholders: Record<string, string> = defaultPlaceholders(projectDir)
      for (const pair of values.set ?? []) {
        const i = pair.indexOf('=')
        if (i <= 0) throw new Error(`--set expects NAME=value, got ${pair}`)
        placeholders[pair.slice(0, i)] = pair.slice(i + 1)
      }
      const required = await requiredPlaceholders(pkg, stacks)
      const missing = required.filter((n) => placeholders[n] === undefined)
      if (missing.length > 0) {
        console.error(
          `missing placeholders: ${missing.join(', ')}\n(pass each with --set NAME=value)`,
        )
        return 1
      }
      const used = Object.fromEntries(required.map((n) => [n, placeholders[n] as string]))
      await writeConfig(projectDir, { stacks, placeholders: used, exclude: [] })
      const config = await readConfig(projectDir)
      const today = new Date().toISOString().slice(0, 10)
      const { written, kept } = await applyTemplates(pkg, projectDir, config, {
        ...config.placeholders,
        STACK_VERSION: version,
        TODAY: today,
      })
      const plan = await planSync(pkg, config, version)
      await applyPlan(projectDir, plan)
      console.log(
        `initialised with stacks ${stacks.join(', ') || '(none)'}: ${written.length} files written, ${kept.length} kept, synced to ${version}`,
      )
      return 0
    }
    case 'sync': {
      const plan = await planSync(pkg, await readConfig(projectDir), version)
      await applyPlan(projectDir, plan)
      console.log(`synced ${plan.files.size} files to ${version}`)
      return 0
    }
    case 'check': {
      const plan = await planSync(pkg, await readConfig(projectDir), version)
      const problems = await checkPlan(projectDir, plan)
      for (const p of problems) console.error(p)
      if (problems.length === 0) console.log(`in sync with ${version}`)
      return problems.length === 0 ? 0 : 1
    }
    case 'migrations': {
      const { positionals, values } = parseArgs({
        args: rest,
        options: { json: { type: 'boolean' } },
        allowPositionals: true,
      })
      const [from, to] = positionals
      if (!from || !to) throw new Error('usage: migrations <from> <to>')
      const config = await readConfig(projectDir)
      const list = migrationsBetween(await readMigrations(pkg), from, to, config.stacks)
      if (values.json)
        console.log(
          JSON.stringify(
            list.map(({ body, ...m }) => m),
            null,
            2,
          ),
        )
      else for (const m of list) console.log(`${m.version}  ${m.risk.padEnd(6)}  ${m.id}`)
      return 0
    }
    case 'placeholders': {
      const { values } = parseArgs({ args: rest, options: { stacks: { type: 'string' } } })
      const stacks = (values.stacks ?? '').split(',').filter(Boolean) as Stack[]
      for (const name of await requiredPlaceholders(pkg, stacks)) console.log(name)
      return 0
    }
    default:
      console.log(usage)
      return command === undefined || command === 'help' ? 0 : 1
  }
}

process.exit(await main(process.argv.slice(2)))
