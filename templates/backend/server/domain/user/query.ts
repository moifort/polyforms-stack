import { Count } from '~/domain/shared/primitives'
import type { Count as CountType, UserId } from '~/domain/shared/types'
import * as repository from '~/domain/user/infrastructure/repository'
import type { MeView } from '~/domain/user/types'

/** The signed-in user's identity and onboarding state. Nulls when no profile
 *  exists yet: the app routes to onboarding on a missing timestamp. */
export const me = async (userId: UserId): Promise<MeView> => {
  const profile = await repository.findProfile(userId)
  return {
    userId,
    firstName: profile?.firstName,
    onboardingCompletedAt: profile?.onboardingCompletedAt,
    admin: profile?.admin === true,
  }
}

/** The first names behind a set of ids, for a list that names people. */
export const namesOf = async (userIds: readonly UserId[]): Promise<Map<UserId, string>> =>
  new Map(
    (await repository.findProfiles(userIds)).map((profile) => [
      profile.userId,
      String(profile.firstName),
    ]),
  )

/** Every account, for the scheduled passes that look after each user. */
export const allIds = async (): Promise<UserId[]> =>
  (await repository.findAllProfiles()).map((profile) => profile.userId)

export const total = async (): Promise<CountType> => Count(await repository.countProfiles())

export const joinedSince = async (since: Date): Promise<CountType> =>
  Count(await repository.countProfilesSince(since))
