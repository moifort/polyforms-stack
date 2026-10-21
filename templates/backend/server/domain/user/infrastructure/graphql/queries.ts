import { builder } from '~/domain/shared/graphql/builder'
import * as UserQuery from '~/domain/user/query'
import { MeType } from './types'

builder.queryField('me', (t) =>
  t.field({
    type: MeType,
    description:
      'The signed-in user, resolved from the auth token. Always returns a `Me`, even ' +
      'before onboarding: a fresh account comes back with only `userId` set.',
    resolve: (_root, _args, { userId }) => UserQuery.me(userId),
  }),
)
