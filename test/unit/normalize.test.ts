import { describe, it, expect } from 'vitest'
import { normalizeCity } from '../../src/geo/normalize.js'

describe('normalizeCity', () => {
  it('lowercases and trims', () => {
    expect(normalizeCity('  Vienna ')).toBe('vienna')
  })
  it('strips diacritics', () => {
    expect(normalizeCity('Kraków')).toBe('krakow')
  })
  it('handles Budapest with surrounding whitespace', () => {
    expect(normalizeCity(' Budapest ')).toBe('budapest')
  })
})
