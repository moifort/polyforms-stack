import { describe, expect, test } from 'bun:test'
import { AdminToken, PublicBaseUrl } from '~/system/config/primitives'

describe('config primitives', () => {
  test('an admin token is any non-empty string', () => {
    expect(AdminToken('x') as string).toBe('x')
    expect(() => AdminToken('')).toThrow()
  })
  test('the public base url must be a url', () => {
    expect(() => PublicBaseUrl('localhost')).toThrow()
    expect(PublicBaseUrl('http://127.0.0.1:3000') as string).toBe('http://127.0.0.1:3000')
  })
})
