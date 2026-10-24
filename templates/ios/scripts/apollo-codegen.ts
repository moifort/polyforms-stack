#!/usr/bin/env bun
/**
 * Generates the app's GraphQL types from the committed schema, exported first on a
 * fresh project that has none yet, with the CLI the resolved apollo-ios package ships
 * (never a global install: its version must match the library's). Resolves the
 * packages first when they are not there.
 *
 *   bun scripts/apollo-codegen.ts
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { $ } from 'bun'

const app = '{{APP_NAME}}'
const root = join(import.meta.dir, '..')
const derived = join(root, 'build/derived')
const cliDir = join(derived, 'SourcePackages/checkouts/apollo-ios/CLI')
const env = { ...process.env, DEVELOPER_DIR: '/Applications/Xcode.app/Contents/Developer' }
const generate = () => $`${join(cliDir, 'apollo-ios-cli')} generate`.cwd(join(root, 'ios')).env(env)

// A fresh project has no schema yet: the backend exports it.
if (!existsSync(join(root, 'shared/schema.graphql'))) {
  await $`bun run generate:graphql`.cwd(root)
}
if (!existsSync(join(cliDir, 'apollo-ios-cli.tar.gz'))) {
  await $`xcodebuild -resolvePackageDependencies -project ios/${app}.xcodeproj -scheme ${app} -derivedDataPath ${derived}`
    .cwd(root)
    .env(env)
    .quiet()
}
if (!existsSync(join(cliDir, 'apollo-ios-cli'))) {
  await $`tar -xzf apollo-ios-cli.tar.gz`.cwd(cliDir)
}
await generate()
// A fresh checkout sometimes skips the namespace file on the first run.
const namespace = join(root, `ios/${app}/Generated/GraphQL/${app}GraphQL.graphql.swift`)
if (!existsSync(namespace)) await generate()
console.log(`GraphQL types generated in ios/${app}/Generated/GraphQL`)
