import { builder } from '~/domain/shared/graphql/builder'
import * as UserCommand from '~/domain/user/command'
import * as UserQuery from '~/domain/user/query'
import * as UserUseCase from '~/domain/user/use-case'
import { CompleteOnboardingInput } from './inputs'
import { MeType } from './types'

builder.mutationField('completeOnboarding', (t) =>
  t.field({
    type: MeType,
    description:
      'Finish onboarding: save the profile. Returns the updated `Me`, with ' +
      '`onboardingCompleted` now true. Reachable again afterwards, so a user can change ' +
      'the name they are addressed by.',
    args: {
      input: t.arg({
        type: CompleteOnboardingInput,
        required: true,
        description: 'The first name to persist.',
      }),
    },
    resolve: async (_root, { input }, { userId }) => {
      await UserCommand.completeOnboarding(userId, input.firstName)
      return UserQuery.me(userId)
    },
  }),
)

builder.mutationField('deleteAccount', (t) =>
  t.boolean({
    description:
      'Permanently delete the signed-in account and all of its data. Irreversible. ' +
      'Required by App Store guideline 5.1.1(v). Does NOT cancel an active App Store ' +
      'subscription: Apple owns that lifecycle. Always returns `true`.',
    resolve: async (_root, _args, { userId }) => {
      await UserUseCase.deleteAccount(userId)
      return true
    },
  }),
)
