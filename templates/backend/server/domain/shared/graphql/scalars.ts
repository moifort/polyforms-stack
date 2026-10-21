import { GraphQLError } from 'graphql'
import { ZodError } from 'zod'
import {
  Count,
  Day,
  Eur,
  Month,
  Percentage,
  PersonName,
  UserId,
  Year,
} from '~/domain/shared/primitives'
import { builder } from './builder'

// A brand's Zod constructor is the single definition of what the value may be, so
// the scalar reuses it rather than restating the rule. A rejection becomes a
// BAD_USER_INPUT the client can show, not a 500.
export const validatedParse =
  <T>(name: string, parse: (value: unknown) => T) =>
  (value: unknown): T => {
    try {
      return parse(value)
    } catch (error) {
      const message =
        error instanceof ZodError
          ? error.issues.map(({ message }) => message).join(', ')
          : `Invalid ${name}`
      throw new GraphQLError(`Invalid value for ${name}: ${message}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }
  }

const scalar = <T>(name: string, description: string, parse: (value: unknown) => T) =>
  builder.scalarType(
    name as never,
    {
      description,
      serialize: (value: unknown) => value,
      parseValue: validatedParse(name, parse),
    } as never,
  )

scalar('UserId', 'A Firebase Auth user identifier, an opaque non-empty string.', UserId)
scalar('PersonName', 'A person the user knows by name, 1 to 200 characters.', PersonName)
scalar('Count', 'A non-negative whole number of things. Example: 12.', Count)
scalar('Percentage', 'A percentage from 0 to 100. Example: 42.5.', Percentage)
scalar('Eur', 'An amount in euros, never negative. Example: 2.99.', Eur)
scalar('Year', 'A four-digit year. Example: 2026.', Year)
scalar('Month', 'A calendar month. Example: "2026-10".', Month)
scalar('Day', 'A calendar day, UTC. Example: "2026-10-04".', Day)
