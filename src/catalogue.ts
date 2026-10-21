import type { Stack } from '~/config'

/** Which stacks a shipped file needs; absent means it always applies. */
export const RULE_STACKS: Record<string, Stack[]> = {
  '07-appstore.md': ['ios'],
  '09-backend.md': ['backend'],
  '10-ios.md': ['ios'],
  '11-ops.md': ['backend'],
  '12-ci.md': ['backend', 'ios'],
  '13-ai.md': ['ai'],
  '14-infra.md': ['backend'],
  '17-landing.md': ['site'],
}

export const ROUTINE_STACKS: Record<string, Stack[]> = {
  'daily-health.md': ['backend'],
  'deprecations.md': ['backend', 'ios'],
}

export const SKILL_STACKS: Record<string, Stack[]> = {
  domain: ['backend'],
  graphql: ['backend'],
  'ios-feature': ['ios'],
  appstore: ['ios'],
}

export const HOOK_STACKS: Record<string, Stack[]> = {
  'shutdown-simulators-after-push.sh': ['ios'],
}

/** A file applies when it needs no stack, or when the project has at least one of the stacks it names. */
export const applies = (needs: Stack[] | undefined, stacks: readonly Stack[]): boolean =>
  needs === undefined || needs.some((stack) => stacks.includes(stack))
