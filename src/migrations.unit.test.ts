import { describe, expect, test } from 'bun:test'
import { type Migration, migrationsBetween, parseFrontmatter } from '~/migrations'

const m = (version: string, id: string, stacks: Migration['stacks'] = ['any']): Migration => ({
  id,
  version,
  stacks,
  risk: 'review',
  rule: 'rules/10-ios.md#x',
  path: '',
  body: '',
})

describe('migrationsBetween', () => {
  const all = [
    m('1.0.0', 'a'),
    m('1.1.0', 'b', ['ios']),
    m('1.2.0', 'c', ['backend']),
    m('2.0.0', 'd'),
  ]
  test('excludes from, includes to', () => {
    expect(migrationsBetween(all, '1.0.0', '1.2.0', ['backend', 'ios']).map((x) => x.id)).toEqual([
      'b',
      'c',
    ])
  })
  test('filters on the project stacks, any always applies', () => {
    expect(migrationsBetween(all, '0.0.0', '2.0.0', ['backend']).map((x) => x.id)).toEqual([
      'a',
      'c',
      'd',
    ])
  })
})

describe('parseFrontmatter', () => {
  test('reads scalars, quoted scalars and lists', () => {
    const { data, body } = parseFrontmatter(
      '---\nid: x-y\nrisk: safe\nstacks: [ios, any]\ncheck: "grep -r x"\n---\nBody\n',
    )
    expect(data).toEqual({ id: 'x-y', risk: 'safe', stacks: ['ios', 'any'], check: 'grep -r x' })
    expect(body).toBe('Body\n')
  })
})
