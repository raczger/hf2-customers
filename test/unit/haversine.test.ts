import { describe, it, expect } from 'vitest'
import { haversineKm } from '../../src/geo/haversine.js'

const BUDAPEST = { lat: 47.4979, lon: 19.0402 }
const VIENNA = { lat: 48.2082, lon: 16.3738 }

describe('haversineKm', () => {
  it('Budapest–Vienna ≈ 214 km', () => {
    const d = haversineKm(BUDAPEST.lat, BUDAPEST.lon, VIENNA.lat, VIENNA.lon)
    expect(d).toBeGreaterThan(210)
    expect(d).toBeLessThan(220)
  })
  it('same point is 0 km', () => {
    const d = haversineKm(BUDAPEST.lat, BUDAPEST.lon, BUDAPEST.lat, BUDAPEST.lon)
    expect(d).toBeCloseTo(0, 6)
  })
})
