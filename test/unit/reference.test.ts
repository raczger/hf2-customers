import { describe, it, expect } from 'vitest'
import { lookupCoords, BUDAPEST } from '../../src/geo/reference.js'

describe('lookupCoords', () => {
  it('finds a known city (Vienna)', () => {
    expect(lookupCoords('Vienna')).toEqual({ lat: 48.2082, lon: 16.3738 })
  })
  it('matches accented city (Kraków)', () => {
    expect(lookupCoords('Kraków')).toEqual({ lat: 50.0647, lon: 19.945 })
  })
  it('maps Budapest districts to the capital', () => {
    expect(lookupCoords('Budapest XI.')).toEqual(BUDAPEST)
  })
  it('returns null for unknown city', () => {
    expect(lookupCoords('Atlantis')).toBeNull()
  })
})
