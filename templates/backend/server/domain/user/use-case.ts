import type { UserId } from '~/domain/shared/types'
import * as UserCommand from '~/domain/user/command'

/** Delete the account and every trace of it. Each step reaches a domain through
 *  its public command surface, never a repository. Idempotent, so a retry after a
 *  partial failure is safe, and the order matters: every per-user collection
 *  first, in parallel; then the profile; then the Firebase Auth user LAST. If an
 *  earlier step fails the user is still signed in and can retry, whereas deleting
 *  auth first would strand the data with nobody able to reach it.
 *
 *  Add each new domain's `deleteAllForUser` to the parallel block as it ships. */
export const deleteAccount = async (userId: UserId) => {
  await Promise.all([
    // <domain>Command.deleteAllForUser(userId),
  ])
  await UserCommand.deleteProfile(userId)
  await UserCommand.deleteAuthAccount(userId)
}
