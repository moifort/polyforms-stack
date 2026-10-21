import { readdir } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { applies, ROUTINE_STACKS, RULE_STACKS } from '~/catalogue'
import { CONFIG_FILE, type Stack, StackConfig } from '~/config'
import { placeholdersIn } from '~/render'
import { templatePlaceholders } from '~/templates'

/** Every placeholder the selected rules and routines use, so init can ask for exactly those. */
export const requiredPlaceholders = async (
  packageDir: string,
  stacks: readonly Stack[],
): Promise<string[]> => {
  const names = new Set<string>()
  for (const [dir, catalogue] of [
    ['rules', RULE_STACKS],
    ['routines', ROUTINE_STACKS],
  ] as const) {
    for (const file of (await readdir(`${packageDir}/${dir}`).catch(() => [])).sort()) {
      if (!file.endsWith('.md') || !applies(catalogue[file], stacks)) continue
      for (const name of placeholdersIn(await Bun.file(`${packageDir}/${dir}/${file}`).text()))
        names.add(name)
    }
  }
  for (const name of await templatePlaceholders(packageDir, stacks)) names.add(name)
  names.delete('STACK_VERSION')
  names.delete('TODAY')
  return [...names].sort()
}

/** Values init can settle without asking: derived from the folder, or a convention. */
export const defaultPlaceholders = (projectDir: string): Record<string, string> => {
  const repoName = basename(projectDir)
  return {
    CODE_DIR: dirname(projectDir),
    REPO_NAME: repoName,
    APP_SLUG: repoName,
    APP_NAME: repoName.charAt(0).toUpperCase() + repoName.slice(1),
    SOURCE_LANGUAGE: 'French',
    SERVED_LANGUAGES: 'French and English',
    REVIEW_LANGUAGE: 'French',
    AI_DAILY_ALERT: '3 euros',
    BILLING_TABLE: 'polyforms-billing.billing_export.gcp_billing_export_v1',
    GITHUB_OWNER: 'moifort',
    GITHUB_REPO: `moifort/${repoName}`,
    BUNDLE_ID: `com.polyforms.${repoName}.app`,
    // Unknown until the App Store Connect record exists: filled in project-context.md
    // and here by the bootstrap's last step.
    APP_STORE_ID: '0',
    // The Apple developer team: from the environment (the keychain at bootstrap).
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID ?? 'TEAMID0000',
    // Until the first deploy prints the function URL: the local server.
    SERVER_URL: 'http://127.0.0.1:3000',
    APP_TAGLINE: "Ce que l'application fait pour vous, en une phrase.",
    APP_TAGLINE_EN: 'What the app does for you, in one sentence.',
  }
}

export const writeConfig = async (projectDir: string, config: StackConfig): Promise<void> => {
  await Bun.write(
    `${projectDir}/${CONFIG_FILE}`,
    `${JSON.stringify(StackConfig.parse(config), null, 2)}\n`,
  )
}
