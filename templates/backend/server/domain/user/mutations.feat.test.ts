import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { graphql } from 'graphql'
import type { UserId } from '~/domain/shared/types'
import { fakeDb, resetFakeFirestore } from '~/test/fake-firestore'

mock.module('~/system/firebase', () => ({ db: fakeDb }))
mock.module('~/system/identity', () => ({ deleteAuthUser: async () => {} }))

const { schema } = await import('~/domain/shared/graphql/schema')

const run = (source: string, userId = 'u1') =>
  graphql({ schema, source, contextValue: { event: undefined, userId: userId as UserId } })

beforeEach(() => {
  resetFakeFirestore()
})

describe('the user API contract', () => {
  test('me answers the id alone before onboarding, then the profile after it', async () => {
    const before = await run('{ me { userId firstName onboardingCompleted } }')
    expect(before.errors).toBeUndefined()
    expect(before.data?.me).toEqual({ userId: 'u1', firstName: null, onboardingCompleted: false })

    const done = await run(
      'mutation { completeOnboarding(input: { firstName: "Ada" }) { firstName onboardingCompleted } }',
    )
    expect(done.data?.completeOnboarding).toEqual({ firstName: 'Ada', onboardingCompleted: true })
  })

  test('an invalid name is a BAD_USER_INPUT, not a 500', async () => {
    const result = await run('mutation { completeOnboarding(input: { firstName: "" }) { userId } }')
    expect(result.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT')
  })

  test('deleteAccount answers true and leaves no profile', async () => {
    await run('mutation { completeOnboarding(input: { firstName: "Ada" }) { userId } }')
    const deleted = await run('mutation { deleteAccount }')
    expect(deleted.data?.deleteAccount).toBe(true)
    const after = await run('{ me { onboardingCompleted } }')
    expect(after.data?.me).toEqual({ onboardingCompleted: false })
  })
})
