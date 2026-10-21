import { builder } from '~/domain/shared/graphql/builder'
import type { MeView } from '~/domain/user/types'

export const MeType = builder.objectRef<MeView>('Me').implement({
  description:
    'The signed-in user: their identity and onboarding state.\n\n' +
    'Always resolvable from the auth token, so `userId` is always present. Every other ' +
    'field is null until the onboarding completes, which lets the app route a fresh ' +
    'account into onboarding.',
  fields: (t) => ({
    userId: t.expose('userId', {
      type: 'UserId',
      description: 'The Firebase Auth user id, also the id of the profile document.',
    }),
    firstName: t.expose('firstName', {
      type: 'PersonName',
      nullable: true,
      description: "The user's first name, set during onboarding; null before it is done.",
    }),
    onboardingCompletedAt: t.expose('onboardingCompletedAt', {
      type: 'DateTime',
      nullable: true,
      description: 'When onboarding finished, or null if it never has.',
    }),
    onboardingCompleted: t.boolean({
      description: 'The flag the app routes on: true once onboarding is done.',
      resolve: (me) => me.onboardingCompletedAt != null,
    }),
    isAdmin: t.expose('admin', {
      type: 'Boolean',
      description:
        'Whether this account may open the in-app admin screen. Set by hand on the profile document.',
    }),
  }),
})
