import SchemaBuilder from '@pothos/core'
import { GraphQLScalarType } from 'graphql'
import type { H3Event } from 'h3'
import type {
  Count,
  Day,
  Eur,
  Month,
  Percentage,
  PersonName,
  UserId,
  Year,
} from '~/domain/shared/types'

/** What every resolver is handed. No loader map on purpose: a nested field that
 *  needs another document is either denormalised on the parent or served by a
 *  per-request loader added when that field ships. */
export type GraphQLContext = {
  event: H3Event
  userId: UserId
}

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description:
    'A date and time serialized as an ISO 8601 string in UTC. ' +
    'Example: "2026-09-14T09:30:00.000Z".',
  serialize: (value: unknown) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value: unknown) => new Date(value as string),
})

export const builder = new SchemaBuilder<{
  Context: GraphQLContext
  DefaultFieldNullability: false
  Scalars: {
    DateTime: { Input: Date; Output: Date }
    UserId: { Input: UserId; Output: UserId }
    PersonName: { Input: PersonName; Output: PersonName }
    Count: { Input: Count; Output: Count }
    Percentage: { Input: Percentage; Output: Percentage }
    Eur: { Input: Eur; Output: Eur }
    Year: { Input: Year; Output: Year }
    Month: { Input: Month; Output: Month }
    Day: { Input: Day; Output: Day }
  }
}>({
  defaultFieldNullability: false,
})

builder.addScalarType('DateTime', DateTimeScalar, {})
builder.queryType({ description: 'Every read of the API. Scoped to the signed-in user.' })
builder.mutationType({ description: 'Every write of the API. Scoped to the signed-in user.' })
