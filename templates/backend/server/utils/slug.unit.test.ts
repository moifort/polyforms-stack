import { describe, expect, test } from 'bun:test'
import { foldedText, slugify, withoutAccents } from '~/utils/slug'

/** slugify keys shared documents: its output may not move by one character.
 *  A project adds the spellings it keys to this table. */
const KEYS: [string, string][] = [
  ["L'Assassin royal", 'assassin-royal'],
  ['Les Misérables', 'miserables'],
  ['Œuvre complète', 'uvre-complete'],
  ['Jean-Paul Sartre', 'jean-paul-sartre'],
  ['The Lord of the Rings', 'lord-of-the-rings'],
  ['Pa`rt', 'pa-rt'],
  ['l·l', 'l'],
  ['ガンダム', ''],
  ['  spaced  out  ', 'spaced-out'],
]

describe('slugify', () => {
  test('keys every spelling exactly as it always has', () => {
    for (const [value, key] of KEYS) expect([value, slugify(value)]).toEqual([value, key])
  })
})

describe('withoutAccents', () => {
  test('drops the accents and keeps the letters', () => {
    expect(withoutAccents('Hélène Ève crème brûlée Ñandú')).toBe('Helene Eve creme brulee Nandu')
  })

  // Only the combining marks go: a spacing accent or a middle dot stays a
  // character of its own, which slugify turns into a separator.
  test('leaves the spacing marks', () => {
    expect(withoutAccents('Pa`rt l·l')).toBe('Pa`rt l·l')
  })
})

describe('foldedText', () => {
  test('ignores accents, case and surrounding space', () => {
    expect(foldedText(" L'Étranger ")).toBe(foldedText("l'etranger"))
  })
})
