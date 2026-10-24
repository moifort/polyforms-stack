import { describe, expect, test } from 'bun:test'
import { placeholdersIn, render } from './render'

describe('render', () => {
  test('replaces every placeholder, each as many times as it appears', () => {
    expect(render('{{A}} and {{B}} and {{A}}', { A: 'x', B: 'y' })).toBe('x and y and x')
  })
  test('lists the placeholders once each, in order', () => {
    expect(placeholdersIn('{{B}} {{A}} {{B}}')).toEqual(['B', 'A'])
  })
  test('fails naming the missing values, before replacing anything', () => {
    expect(() => render('{{A}} {{B}}', { A: 'x' })).toThrow('missing placeholder value: B')
  })
  test('ignores lowercase braces and template syntax that is not a placeholder', () => {
    expect(render('{{ not }} {{a}}', {})).toBe('{{ not }} {{a}}')
  })
})
