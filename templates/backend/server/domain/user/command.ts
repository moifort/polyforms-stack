import type { PersonName, UserId } from '~/domain/shared/types'
import * as repository from '~/domain/user/infrastructure/repository'

/** Persist the profile that marks onboarding done. Reachable again afterwards, so
 *  a user can change the name they are addressed by. */
export const completeOnboarding = (userId: UserId, firstName: PersonName) =>
  repository.saveProfile({ userId, firstName, onboardingCompletedAt: new Date() })

export const deleteProfile = async (userId: UserId) => {
  await repository.removeProfile(userId)
}

/** The last step of an account deletion, after every trace of its data is gone. */
export const deleteAuthAccount = async (userId: UserId) => {
  await repository.removeAuthUser(userId)
}
