import type { UserId } from '~/domain/shared/types'
import type { UserProfile } from '~/domain/user/types'
import { db } from '~/system/firebase'
import { deleteAuthUser } from '~/system/identity'
import { evictFromRequestCache, memoizedPerRequest } from '~/system/request-cache'
import { findDocuments, genericDataConverter, withoutAbsentFields } from '~/utils/firestore'

const profiles = () => db().collection('users').withConverter(genericDataConverter<UserProfile>())

const cacheKey = (userId: UserId) => `user:profile:${userId}`

/** A user's profile, at most one: the document id IS the userId. Memoized: the
 *  auth gate reads it on every launch, so it must cost a single read per request.
 *  Undefined when there is none, as Firestore answers. */
export const findProfile = (userId: UserId): Promise<UserProfile | undefined> =>
  memoizedPerRequest(cacheKey(userId), async () => (await profiles().doc(userId).get()).data())

/** The names behind a list of ids, in one getAll rather than a lookup per row. */
export const findProfiles = (userIds: readonly UserId[]): Promise<UserProfile[]> =>
  findDocuments(profiles(), userIds)

/** Every profile, for a scheduled pass: a scan, read once per run. */
export const findAllProfiles = async (): Promise<UserProfile[]> =>
  (await profiles().get()).docs.map((doc) => doc.data())

/** How many accounts have a profile: one billed aggregate, never a scan. */
export const countProfiles = async (): Promise<number> =>
  (await profiles().count().get()).data().count

export const countProfilesSince = async (since: Date): Promise<number> =>
  (await profiles().where('onboardingCompletedAt', '>=', since).count().get()).data().count

export const saveProfile = async (profile: UserProfile): Promise<UserProfile> => {
  await profiles().doc(profile.userId).set(withoutAbsentFields(profile))
  // The onboarding read the profile to know whether it was the first time, then
  // answers with what it just wrote: the absence it saw must not be read back.
  evictFromRequestCache(cacheKey(profile.userId))
  return profile
}

/** Idempotent: an already-absent profile is a no-op, so a retried deletion never errors. */
export const removeProfile = async (userId: UserId): Promise<void> => {
  await profiles().doc(userId).delete()
  evictFromRequestCache(cacheKey(userId))
}

/** The one place the auth provider is touched: external access stays in the storage layer. */
export const removeAuthUser = async (userId: UserId): Promise<void> => {
  await deleteAuthUser(userId)
}
