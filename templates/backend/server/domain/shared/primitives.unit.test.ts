import { describe, expect, test } from 'bun:test'
import { Count, Day, PersonName, UserId, Year } from '~/domain/shared/primitives'

describe('shared primitives', () => {
  test('a user id is any non-empty string', () => {
    expect(UserId('abc') as string).toBe('abc')
    expect(() => UserId('')).toThrow()
  })
  test('a person name is trimmed and bounded', () => {
    expect(PersonName('  Ada ') as string).toBe('Ada')
    expect(() => PersonName('x'.repeat(201))).toThrow()
  })
  test('a count accepts a numeric string and refuses a negative', () => {
    expect(Count('3') as number).toBe(3)
    expect(() => Count(-1)).toThrow()
  })
  test('a year stays within a plausible range', () => {
    expect(() => Year(999)).toThrow()
    expect(Year(2026) as number).toBe(2026)
  })
  test('a day is a UTC date string', () => {
    expect(Day('2026-10-04') as string).toBe('2026-10-04')
    expect(() => Day('04/10/2026')).toThrow()
  })
})
