import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { PersonName, UserId } from '~/domain/shared/types'
import type { UserProfile } from '~/domain/user/types'
import { fakeDb, resetFakeFirestore } from '~/test/fake-firestore'

mock.module('~/system/firebase', () => ({ db: fakeDb }))

const UserQuery = await import('~/domain/user/query')
const UserCommand = await import('~/domain/user/command')

const user = (id: string) => id as UserId

let fake = resetFakeFirestore()

beforeEach(() => {
  fake = resetFakeFirestore()
})

describe('UserQuery.me', () => {
  test('returns nulls when no profile exists, so the app routes to onboarding', async () => {
    const me = await UserQuery.me(user('u1'))
    expect(me.userId).toBe(user('u1'))
    expect(me.firstName).toBeUndefined()
    expect(me.onboardingCompletedAt).toBeUndefined()
    expect(fake.docReads).toBe(1)
    expect(fake.queryReads).toBe(0)
  })

  test('returns the first name and the timestamp once a profile is saved', async () => {
    const profile: UserProfile = {
      userId: user('u1'),
      firstName: 'Ada' as PersonName,
      onboardingCompletedAt: new Date('2026-01-01'),
    }
    fake.seed('users', 'u1', profile)
    const me = await UserQuery.me(user('u1'))
    expect(me.firstName as string).toBe('Ada')
    expect(me.onboardingCompletedAt).toEqual(new Date('2026-01-01'))
  })
})

describe('UserCommand.completeOnboarding', () => {
  test('writes the profile and the same request reads it back', async () => {
    await UserCommand.completeOnboarding(user('u1'), 'Ada' as PersonName)
    const me = await UserQuery.me(user('u1'))
    expect(me.firstName as string).toBe('Ada')
    expect(me.onboardingCompletedAt).toBeInstanceOf(Date)
  })
})
