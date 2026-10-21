import { builder } from './builder'

// Custom scalars must be registered before any type that references them.
import './scalars'

// Domain GraphQL layers, imported as they come online. Each domain owns its
// enums.ts, types.ts, inputs.ts, queries.ts and mutations.ts under
// infrastructure/graphql/. Order matters when a domain borrows another's scalar
// or enum: register the lender first.

// User (profile, onboarding state, account deletion)
import '~/domain/user/infrastructure/graphql/types'
import '~/domain/user/infrastructure/graphql/inputs'
import '~/domain/user/infrastructure/graphql/queries'
import '~/domain/user/infrastructure/graphql/mutations'

// Changelog (the app's "What's new" list, served from the committed changelogs)
import '~/domain/changelog/infrastructure/graphql/types'
import '~/domain/changelog/infrastructure/graphql/queries'

export const schema = builder.toSchema()
