import { builder } from '~/domain/shared/graphql/builder'

export const CompleteOnboardingInput = builder.inputType('CompleteOnboardingInput', {
  description: 'What the onboarding collects: a first name, so the app can address the user.',
  fields: (t) => ({
    firstName: t.field({
      type: 'PersonName',
      required: true,
      description: "The user's first name.",
    }),
  }),
})
